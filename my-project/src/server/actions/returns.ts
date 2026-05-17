"use server";

import { prisma } from "@/lib/prisma";
import {
  Prisma,
  ReturnStatus,
  ReturnReason,
  RefundMethod,
  InventoryTransactionType,
  PaymentMethod,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/server/actions/notifications";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface ReturnItemInput {
  orderItemId: string;
  quantity: number;
  restock?: boolean;
  conditionNote?: string | null;
}

export interface CreateReturnRequestInput {
  orderId: string;
  shipmentId?: string | null;
  requestedById: string;
  reason: ReturnReason;
  reasonNote?: string | null;
  refundMethod?: RefundMethod;
  notes?: string | null;
  items: ReturnItemInput[];
}

export interface UpdateReturnRequestInput {
  reason?: ReturnReason;
  reasonNote?: string | null;
  refundMethod?: RefundMethod;
  notes?: string | null;
}

export interface ReturnListItem {
  id: string;
  returnNumber: string;
  orderId: string;
  status: ReturnStatus;
  reason: ReturnReason;
  refundAmount: number;
  refundMethod: RefundMethod;
  customerName: string | null;
  customerEmail: string;
  itemCount: number;
  totalQuantity: number;
  createdAt: Date;
  reviewedAt: Date | null;
  receivedAt: Date | null;
  refundedAt: Date | null;
}

export interface ReturnLineItem {
  id: string;
  orderItemId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  orderedQuantity: number;
  unitPrice: number;
  subTotal: number;
  restock: boolean;
  conditionNote: string | null;
}

export interface ReturnDetail extends ReturnListItem {
  shipmentId: string | null;
  shipmentNumber: string | null;
  requestedById: string;
  requestedByName: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  reasonNote: string | null;
  notes: string | null;
  restocked: boolean;
  refundPaymentId: string | null;
  items: ReturnLineItem[];
}

export interface ReturnableOrderItem {
  orderItemId: string;
  productId: string;
  productName: string;
  productSku: string;
  orderedQuantity: number;
  alreadyReturnedQuantity: number;
  returnableQuantity: number;
  unitPrice: number;
}

export interface ReturnableOrder {
  id: string;
  customerName: string | null;
  customerEmail: string;
  customerUserId: string;
  totalAmount: number;
  hasInvoice: boolean;
  invoiceId: string | null;
  items: ReturnableOrderItem[];
  shipments: { id: string; shipmentNumber: string }[];
}

export interface ReturnSummary {
  totalReturns: number;
  pending: number;
  approved: number;
  received: number;
  refunded: number;
  totalRefundAmount: number;
}

export interface ReturnFilter {
  status?: ReturnStatus | "ALL";
  reason?: ReturnReason | "ALL";
  search?: string;
}

// --- Helpers ---

function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

// สร้างเลข RMA รูปแบบ RMA-YYYYMM-XXXX
async function generateReturnNumber(): Promise<string> {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `RMA-${yyyymm}-`;

  const last = await prisma.returnRequest.findFirst({
    where: { returnNumber: { startsWith: prefix } },
    orderBy: { returnNumber: "desc" },
    select: { returnNumber: true },
  });

  let seq = 1;
  if (last) {
    const tail = last.returnNumber.slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// แมป RefundMethod -> PaymentMethod สำหรับบันทึก PaymentRecord
function mapRefundToPaymentMethod(method: RefundMethod): PaymentMethod {
  switch (method) {
    case "CASH":
      return "CASH";
    case "STORE_CREDIT":
      return "CREDIT";
    case "BANK_TRANSFER":
    case "ORIGINAL_PAYMENT":
    default:
      return "BANK_TRANSFER";
  }
}

// --- Queries ---

export async function getReturns(
  filter?: ReturnFilter,
): Promise<ActionResult<ReturnListItem[]>> {
  try {
    const where: Prisma.ReturnRequestWhereInput = {};
    if (filter?.status && filter.status !== "ALL") where.status = filter.status;
    if (filter?.reason && filter.reason !== "ALL") where.reason = filter.reason;
    if (filter?.search) {
      where.OR = [
        { returnNumber: { contains: filter.search, mode: "insensitive" } },
        { order: { id: { contains: filter.search, mode: "insensitive" } } },
        {
          requestedBy: {
            OR: [
              { name: { contains: filter.search, mode: "insensitive" } },
              { email: { contains: filter.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const returns = await prisma.returnRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: { select: { name: true, email: true } },
        items: { select: { quantity: true } },
      },
    });

    const data: ReturnListItem[] = returns.map((r) => ({
      id: r.id,
      returnNumber: r.returnNumber,
      orderId: r.orderId,
      status: r.status,
      reason: r.reason,
      refundAmount: dec(r.refundAmount),
      refundMethod: r.refundMethod,
      customerName: r.requestedBy.name,
      customerEmail: r.requestedBy.email,
      itemCount: r.items.length,
      totalQuantity: r.items.reduce((sum, it) => sum + it.quantity, 0),
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
      receivedAt: r.receivedAt,
      refundedAt: r.refundedAt,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getReturns failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load returns.";
    return { data: null, error: message };
  }
}

export async function getReturnById(
  id: string,
): Promise<ActionResult<ReturnDetail>> {
  try {
    const r = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true } },
        shipment: { select: { id: true, shipmentNumber: true } },
        items: {
          include: {
            orderItem: {
              include: {
                product: { select: { name: true, sku: true } },
              },
            },
          },
        },
      },
    });

    if (!r) return { data: null, error: "Return request not found." };

    const items: ReturnLineItem[] = r.items.map((it) => ({
      id: it.id,
      orderItemId: it.orderItemId,
      productId: it.orderItem.productId,
      productName: it.orderItem.product.name,
      productSku: it.orderItem.product.sku,
      quantity: it.quantity,
      orderedQuantity: it.orderItem.quantity,
      unitPrice: dec(it.unitPrice),
      subTotal: dec(it.subTotal),
      restock: it.restock,
      conditionNote: it.conditionNote,
    }));

    const data: ReturnDetail = {
      id: r.id,
      returnNumber: r.returnNumber,
      orderId: r.orderId,
      status: r.status,
      reason: r.reason,
      refundAmount: dec(r.refundAmount),
      refundMethod: r.refundMethod,
      customerName: r.requestedBy.name,
      customerEmail: r.requestedBy.email,
      itemCount: items.length,
      totalQuantity: items.reduce((s, it) => s + it.quantity, 0),
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
      receivedAt: r.receivedAt,
      refundedAt: r.refundedAt,
      shipmentId: r.shipment?.id ?? null,
      shipmentNumber: r.shipment?.shipmentNumber ?? null,
      requestedById: r.requestedBy.id,
      requestedByName: r.requestedBy.name,
      reviewedById: r.reviewedBy?.id ?? null,
      reviewedByName: r.reviewedBy?.name ?? null,
      reasonNote: r.reasonNote,
      notes: r.notes,
      restocked: r.restocked,
      refundPaymentId: r.refundPaymentId,
      items,
    };

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getReturnById failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load return.";
    return { data: null, error: message };
  }
}

export async function getReturnSummary(): Promise<ActionResult<ReturnSummary>> {
  try {
    const [all, pending, approved, received, refunded, refundAgg] =
      await Promise.all([
        prisma.returnRequest.count(),
        prisma.returnRequest.count({ where: { status: "REQUESTED" } }),
        prisma.returnRequest.count({ where: { status: "APPROVED" } }),
        prisma.returnRequest.count({ where: { status: "RECEIVED" } }),
        prisma.returnRequest.count({ where: { status: "REFUNDED" } }),
        prisma.returnRequest.aggregate({
          where: { status: "REFUNDED" },
          _sum: { refundAmount: true },
        }),
      ]);

    const data: ReturnSummary = {
      totalReturns: all,
      pending,
      approved,
      received,
      refunded,
      totalRefundAmount: dec(refundAgg._sum.refundAmount),
    };
    return { data, error: null };
  } catch (error: unknown) {
    console.error("getReturnSummary failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load summary.";
    return { data: null, error: message };
  }
}

// ดึง order ที่คืนได้ (สถานะ DELIVERED หรือ SHIPPED) พร้อมจำนวนคงเหลือที่ยังคืนได้
export async function getReturnableOrders(): Promise<
  ActionResult<ReturnableOrder[]>
> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["SHIPPED", "DELIVERED"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        invoice: { select: { id: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } },
            returnItems: {
              // นับเฉพาะ return ที่ยังไม่ถูกปฏิเสธ/ยกเลิก
              where: {
                returnRequest: {
                  status: { notIn: ["REJECTED", "CANCELLED"] },
                },
              },
              select: { quantity: true },
            },
          },
        },
        shipments: { select: { id: true, shipmentNumber: true } },
      },
    });

    const data: ReturnableOrder[] = orders
      .map((o) => {
        const items: ReturnableOrderItem[] = o.items.map((it) => {
          const returned = it.returnItems.reduce(
            (sum, ri) => sum + ri.quantity,
            0,
          );
          return {
            orderItemId: it.id,
            productId: it.productId,
            productName: it.product.name,
            productSku: it.product.sku,
            orderedQuantity: it.quantity,
            alreadyReturnedQuantity: returned,
            returnableQuantity: Math.max(0, it.quantity - returned),
            unitPrice: dec(it.unitPrice),
          };
        });
        return {
          id: o.id,
          customerName: o.user.name,
          customerEmail: o.user.email,
          customerUserId: o.user.id,
          totalAmount: dec(o.totalAmount),
          hasInvoice: o.invoice !== null,
          invoiceId: o.invoice?.id ?? null,
          items,
          shipments: o.shipments,
        };
      })
      // กรองเหลือเฉพาะ order ที่ยังมี item คืนได้
      .filter((o) => o.items.some((it) => it.returnableQuantity > 0));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getReturnableOrders failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load returnable orders.";
    return { data: null, error: message };
  }
}

// --- Mutations ---

export async function createReturnRequest(
  input: CreateReturnRequestInput,
): Promise<ActionResult<{ id: string; returnNumber: string }>> {
  try {
    if (!input.orderId) {
      return { data: null, error: "orderId is required." };
    }
    if (!input.requestedById) {
      return { data: null, error: "requestedById is required." };
    }
    if (!input.items || input.items.length === 0) {
      return { data: null, error: "At least one return item is required." };
    }
    if (input.items.some((it) => !it.orderItemId || it.quantity <= 0)) {
      return { data: null, error: "Item quantity must be > 0." };
    }

    // ตรวจ order มีจริง + อยู่ในสถานะที่คืนได้
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      select: { id: true, status: true, userId: true },
    });
    if (!order) return { data: null, error: "Order not found." };
    if (!["SHIPPED", "DELIVERED"].includes(order.status)) {
      return {
        data: null,
        error: "Only shipped or delivered orders can be returned.",
      };
    }

    // ตรวจ orderItems ทั้งหมดเป็นของ order นี้ และจำนวนไม่เกิน returnable
    const orderItems = await prisma.orderItem.findMany({
      where: {
        id: { in: input.items.map((it) => it.orderItemId) },
        orderId: input.orderId,
      },
      include: {
        returnItems: {
          where: {
            returnRequest: {
              status: { notIn: ["REJECTED", "CANCELLED"] },
            },
          },
          select: { quantity: true },
        },
      },
    });

    if (orderItems.length !== input.items.length) {
      return {
        data: null,
        error: "Some order items not found or not in this order.",
      };
    }

    // คำนวณ refundAmount + เตรียม nested items create
    let totalRefund = new Prisma.Decimal(0);
    const itemCreates: Prisma.ReturnItemCreateWithoutReturnRequestInput[] = [];
    for (const it of input.items) {
      const oi = orderItems.find((o) => o.id === it.orderItemId);
      if (!oi) continue;
      const returned = oi.returnItems.reduce((s, ri) => s + ri.quantity, 0);
      const remaining = oi.quantity - returned;
      if (it.quantity > remaining) {
        return {
          data: null,
          error: `Item ${oi.id.substring(0, 6)}: only ${remaining} eligible for return.`,
        };
      }
      const unitPrice = new Prisma.Decimal(oi.unitPrice);
      const subTotal = unitPrice.mul(it.quantity);
      totalRefund = totalRefund.add(subTotal);
      itemCreates.push({
        orderItem: { connect: { id: it.orderItemId } },
        quantity: it.quantity,
        unitPrice,
        subTotal,
        restock: it.restock ?? true,
        conditionNote: it.conditionNote ?? null,
      });
    }

    const returnNumber = await generateReturnNumber();

    const created = await prisma.returnRequest.create({
      data: {
        returnNumber,
        orderId: input.orderId,
        shipmentId: input.shipmentId ?? null,
        requestedById: input.requestedById,
        reason: input.reason,
        reasonNote: input.reasonNote ?? null,
        refundAmount: totalRefund,
        refundMethod: input.refundMethod ?? "ORIGINAL_PAYMENT",
        notes: input.notes ?? null,
        items: { create: itemCreates },
      },
      select: { id: true, returnNumber: true },
    });

    // แจ้งเตือนเจ้าของ order
    await createNotification({
      userId: order.userId,
      type: "SYSTEM",
      title: `Return request ${returnNumber} created`,
      message: `A return request has been opened for order ${input.orderId.substring(0, 8)}.`,
      link: `/merchant/returns/${created.id}`,
      metadata: { returnId: created.id, orderId: input.orderId },
    });

    revalidatePath("/merchant/returns");
    revalidatePath("/merchant/orders");
    return { data: created, error: null };
  } catch (error: unknown) {
    console.error("createReturnRequest failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create return.";
    return { data: null, error: message };
  }
}

export async function updateReturnRequest(
  id: string,
  input: UpdateReturnRequestInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const existing = await prisma.returnRequest.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) return { data: null, error: "Return not found." };
    // แก้ได้เฉพาะตอน REQUESTED
    if (existing.status !== "REQUESTED") {
      return {
        data: null,
        error: "Only REQUESTED returns can be edited.",
      };
    }

    const data: Prisma.ReturnRequestUpdateInput = {};
    if (input.reason !== undefined) data.reason = input.reason;
    if (input.reasonNote !== undefined) data.reasonNote = input.reasonNote;
    if (input.refundMethod !== undefined) data.refundMethod = input.refundMethod;
    if (input.notes !== undefined) data.notes = input.notes;

    const updated = await prisma.returnRequest.update({
      where: { id },
      data,
      select: { id: true },
    });

    revalidatePath("/merchant/returns");
    revalidatePath(`/merchant/returns/${id}`);
    return { data: updated, error: null };
  } catch (error: unknown) {
    console.error("updateReturnRequest failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update return.";
    return { data: null, error: message };
  }
}

// อนุมัติคำขอคืน (REQUESTED -> APPROVED)
export async function approveReturnRequest(
  id: string,
  reviewerId: string,
  note?: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const existing = await prisma.returnRequest.findUnique({
      where: { id },
      include: { order: { select: { userId: true } } },
    });
    if (!existing) return { data: null, error: "Return not found." };
    if (existing.status !== "REQUESTED") {
      return {
        data: null,
        error: `Cannot approve a return in status ${existing.status}.`,
      };
    }

    await prisma.returnRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        notes: note ? note : existing.notes,
      },
    });

    await createNotification({
      userId: existing.order.userId,
      type: "SYSTEM",
      title: `Return ${existing.returnNumber} approved`,
      message: "Your return request has been approved. Please ship items back.",
      link: `/merchant/returns/${id}`,
      metadata: { returnId: id },
    });

    revalidatePath("/merchant/returns");
    revalidatePath(`/merchant/returns/${id}`);
    return { data: { id }, error: null };
  } catch (error: unknown) {
    console.error("approveReturnRequest failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to approve return.";
    return { data: null, error: message };
  }
}

export async function rejectReturnRequest(
  id: string,
  reviewerId: string,
  reason: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!reason?.trim()) {
      return { data: null, error: "Rejection reason is required." };
    }
    const existing = await prisma.returnRequest.findUnique({
      where: { id },
      include: { order: { select: { userId: true } } },
    });
    if (!existing) return { data: null, error: "Return not found." };
    if (!["REQUESTED", "APPROVED"].includes(existing.status)) {
      return {
        data: null,
        error: `Cannot reject a return in status ${existing.status}.`,
      };
    }

    await prisma.returnRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        notes: reason.trim(),
      },
    });

    await createNotification({
      userId: existing.order.userId,
      type: "SYSTEM",
      title: `Return ${existing.returnNumber} rejected`,
      message: `Your return request was rejected: ${reason}`,
      link: `/merchant/returns/${id}`,
      metadata: { returnId: id },
    });

    revalidatePath("/merchant/returns");
    revalidatePath(`/merchant/returns/${id}`);
    return { data: { id }, error: null };
  } catch (error: unknown) {
    console.error("rejectReturnRequest failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to reject return.";
    return { data: null, error: message };
  }
}

// ทำเครื่องหมายว่าได้รับของคืนแล้ว + restock เข้า inventory (สำหรับ items ที่ restock=true)
export async function markReturnReceived(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const existing = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: { select: { userId: true } },
        items: {
          include: {
            orderItem: {
              include: {
                product: {
                  include: {
                    // Phase 24: 1 product มีได้หลาย inventoryItem — เลือกอันแรกสำหรับ restock
                    inventoryItems: { select: { id: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!existing) return { data: null, error: "Return not found." };
    if (existing.status !== "APPROVED") {
      return {
        data: null,
        error: `Cannot receive a return in status ${existing.status}.`,
      };
    }

    // ทำใน transaction: update status + restock + log inventory transactions
    await prisma.$transaction(async (tx) => {
      await tx.returnRequest.update({
        where: { id },
        data: {
          status: "RECEIVED",
          receivedAt: new Date(),
          restocked: true,
        },
      });

      // restock เฉพาะ item ที่มี restock=true และมี inventory
      for (const it of existing.items) {
        if (!it.restock) continue;
        const inv = it.orderItem.product.inventoryItems[0];
        if (!inv) continue;
        await tx.inventoryItem.update({
          where: { id: inv.id },
          data: { quantity: { increment: it.quantity } },
        });
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: inv.id,
            type: InventoryTransactionType.RETURN,
            quantityDelta: it.quantity,
            note: `Restock from return ${existing.returnNumber}`,
          },
        });
      }
    });

    await createNotification({
      userId: existing.order.userId,
      type: "SYSTEM",
      title: `Return ${existing.returnNumber} received`,
      message: "Your returned items have been received and inspected.",
      link: `/merchant/returns/${id}`,
      metadata: { returnId: id },
    });

    revalidatePath("/merchant/returns");
    revalidatePath(`/merchant/returns/${id}`);
    revalidatePath("/merchant/inventory");
    return { data: { id }, error: null };
  } catch (error: unknown) {
    console.error("markReturnReceived failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to mark as received.";
    return { data: null, error: message };
  }
}

// บันทึก refund (RECEIVED -> REFUNDED) + สร้าง PaymentRecord ติดลบ
export async function processRefund(
  id: string,
  refundAmount?: number,
): Promise<ActionResult<{ id: string }>> {
  try {
    const existing = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            invoice: { select: { id: true } },
            user: { select: { id: true } },
          },
        },
      },
    });
    if (!existing) return { data: null, error: "Return not found." };
    if (existing.status !== "RECEIVED") {
      return {
        data: null,
        error: `Cannot refund a return in status ${existing.status}.`,
      };
    }

    // ใช้ refundAmount ที่ส่งมา ถ้าไม่มีก็ใช้ค่าใน record
    const amount =
      refundAmount !== undefined
        ? new Prisma.Decimal(refundAmount)
        : new Prisma.Decimal(existing.refundAmount);

    if (amount.lte(0)) {
      return { data: null, error: "Refund amount must be > 0." };
    }

    const invoiceId = existing.order.invoice?.id ?? null;

    await prisma.$transaction(async (tx) => {
      let paymentId: string | null = null;
      // ถ้ามี invoice ผูกอยู่ → บันทึก PaymentRecord ติดลบเป็น refund
      if (invoiceId) {
        const payment = await tx.paymentRecord.create({
          data: {
            invoiceId,
            amount: amount.neg(),
            method: mapRefundToPaymentMethod(existing.refundMethod),
            reference: existing.returnNumber,
            note: `Refund for ${existing.returnNumber}`,
          },
          select: { id: true },
        });
        paymentId = payment.id;
      }

      await tx.returnRequest.update({
        where: { id },
        data: {
          status: "REFUNDED",
          refundAmount: amount,
          refundedAt: new Date(),
          refundPaymentId: paymentId,
        },
      });

      // ถ้าใช้ STORE_CREDIT → คืน creditUsed ของ CustomerProfile
      if (existing.refundMethod === "STORE_CREDIT") {
        const profile = await tx.customerProfile.findUnique({
          where: { userId: existing.order.user.id },
          select: { id: true, creditUsed: true },
        });
        if (profile) {
          const newUsed = new Prisma.Decimal(profile.creditUsed).sub(amount);
          await tx.customerProfile.update({
            where: { id: profile.id },
            data: {
              creditUsed: newUsed.lt(0) ? new Prisma.Decimal(0) : newUsed,
            },
          });
        }
      }
    });

    await createNotification({
      userId: existing.order.user.id,
      type: "SYSTEM",
      title: `Refund processed for ${existing.returnNumber}`,
      message: `A refund of ${amount.toFixed(2)} has been issued.`,
      link: `/merchant/returns/${id}`,
      metadata: { returnId: id, amount: amount.toString() },
    });

    revalidatePath("/merchant/returns");
    revalidatePath(`/merchant/returns/${id}`);
    revalidatePath("/merchant/invoices");
    revalidatePath("/merchant/customers");
    return { data: { id }, error: null };
  } catch (error: unknown) {
    console.error("processRefund failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process refund.";
    return { data: null, error: message };
  }
}

export async function cancelReturnRequest(
  id: string,
  note?: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const existing = await prisma.returnRequest.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) return { data: null, error: "Return not found." };
    if (["REFUNDED", "CANCELLED", "REJECTED"].includes(existing.status)) {
      return {
        data: null,
        error: `Cannot cancel a return in status ${existing.status}.`,
      };
    }

    await prisma.returnRequest.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: note ?? undefined,
      },
    });

    revalidatePath("/merchant/returns");
    revalidatePath(`/merchant/returns/${id}`);
    return { data: { id }, error: null };
  } catch (error: unknown) {
    console.error("cancelReturnRequest failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to cancel return.";
    return { data: null, error: message };
  }
}
