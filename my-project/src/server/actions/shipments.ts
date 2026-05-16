"use server";

import { prisma } from "@/lib/prisma";
import {
  Prisma,
  ShipmentStatus,
  ShipmentEventType,
  ShippingDocumentType,
  OrderStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/server/actions/notifications";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface ShipmentItemInput {
  orderItemId: string;
  quantity: number;
}

export interface CreateShipmentInput {
  orderId: string;
  carrierId?: string | null;
  trackingNumber?: string | null;
  shippingCost?: number;
  weightKg?: number;
  shipToName: string;
  shipToPhone?: string | null;
  shipToAddress: string;
  shipToCity?: string | null;
  shipToPostal?: string | null;
  shipToCountry?: string | null;
  estimatedDelivery?: Date | null;
  notes?: string | null;
  items: ShipmentItemInput[];
  createdById?: string | null;
}

export interface UpdateShipmentInput {
  carrierId?: string | null;
  trackingNumber?: string | null;
  shippingCost?: number;
  weightKg?: number;
  shipToName?: string;
  shipToPhone?: string | null;
  shipToAddress?: string;
  shipToCity?: string | null;
  shipToPostal?: string | null;
  shipToCountry?: string | null;
  estimatedDelivery?: Date | null;
  notes?: string | null;
}

export interface AddShipmentEventInput {
  shipmentId: string;
  type: ShipmentEventType;
  message: string;
  location?: string | null;
  occurredAt?: Date;
}

export interface ShipmentListItem {
  id: string;
  shipmentNumber: string;
  orderId: string;
  status: ShipmentStatus;
  carrierId: string | null;
  carrierName: string | null;
  trackingNumber: string | null;
  shipToName: string;
  shipToCity: string | null;
  shippingCost: number;
  weightKg: number;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  estimatedDelivery: Date | null;
  itemCount: number;
  createdAt: Date;
}

export interface ShipmentEventItem {
  id: string;
  type: ShipmentEventType;
  message: string;
  location: string | null;
  occurredAt: Date;
  createdAt: Date;
}

export interface ShipmentLineItem {
  id: string;
  orderItemId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  orderedQuantity: number;
  unitPrice: number;
}

export interface ShipmentDocumentItem {
  id: string;
  type: ShippingDocumentType;
  fileUrl: string | null;
  documentNumber: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface ShipmentDetail extends ShipmentListItem {
  shipToPhone: string | null;
  shipToAddress: string;
  shipToPostal: string | null;
  shipToCountry: string | null;
  notes: string | null;
  trackingUrl: string | null;
  events: ShipmentEventItem[];
  items: ShipmentLineItem[];
  documents: ShipmentDocumentItem[];
  orderTotal: number;
  customerName: string | null;
  customerEmail: string | null;
}

export interface ShipmentSummary {
  totalShipments: number;
  pending: number;
  inTransit: number;
  delivered: number;
  failed: number;
  totalCost: number;
}

export interface ShipmentFilter {
  status?: ShipmentStatus | "ALL";
  carrierId?: string;
  search?: string;
}

// --- Helpers ---

function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

// สร้างเลข shipment รูปแบบ SHP-YYYYMM-XXXX
async function generateShipmentNumber(): Promise<string> {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `SHP-${yyyymm}-`;

  const last = await prisma.shipment.findFirst({
    where: { shipmentNumber: { startsWith: prefix } },
    orderBy: { shipmentNumber: "desc" },
    select: { shipmentNumber: true },
  });

  let seq = 1;
  if (last) {
    const tail = last.shipmentNumber.slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// แปลง status ของ shipment → ผลต่อ order.status (รวม shipment ของ order ทั้งหมด)
function deriveOrderStatusFromShipments(
  statuses: ShipmentStatus[]
): OrderStatus | null {
  if (statuses.length === 0) return null;
  // ถ้าทุก shipment delivered → DELIVERED
  if (statuses.every((s) => s === "DELIVERED")) return "DELIVERED";
  // ถ้ามีอย่างน้อย 1 อยู่ระหว่างขนส่ง → SHIPPED
  if (
    statuses.some((s) =>
      ["IN_TRANSIT", "OUT_FOR_DELIVERY", "READY_TO_SHIP"].includes(s)
    )
  ) {
    return "SHIPPED";
  }
  return null;
}

// --- Queries ---

export async function getShipments(
  filter?: ShipmentFilter
): Promise<ActionResult<ShipmentListItem[]>> {
  try {
    const where: Prisma.ShipmentWhereInput = {};
    if (filter?.status && filter.status !== "ALL") where.status = filter.status;
    if (filter?.carrierId) where.carrierId = filter.carrierId;
    if (filter?.search) {
      where.OR = [
        { shipmentNumber: { contains: filter.search, mode: "insensitive" } },
        { trackingNumber: { contains: filter.search, mode: "insensitive" } },
        { shipToName: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        carrier: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });

    const data: ShipmentListItem[] = shipments.map((s) => ({
      id: s.id,
      shipmentNumber: s.shipmentNumber,
      orderId: s.orderId,
      status: s.status,
      carrierId: s.carrier?.id ?? null,
      carrierName: s.carrier?.name ?? null,
      trackingNumber: s.trackingNumber,
      shipToName: s.shipToName,
      shipToCity: s.shipToCity,
      shippingCost: dec(s.shippingCost),
      weightKg: dec(s.weightKg),
      shippedAt: s.shippedAt,
      deliveredAt: s.deliveredAt,
      estimatedDelivery: s.estimatedDelivery,
      itemCount: s._count.items,
      createdAt: s.createdAt,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getShipments failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load shipments.";
    return { data: null, error: message };
  }
}

export async function getShipmentById(
  id: string
): Promise<ActionResult<ShipmentDetail>> {
  try {
    const s = await prisma.shipment.findUnique({
      where: { id },
      include: {
        carrier: true,
        events: { orderBy: { occurredAt: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        items: {
          include: {
            orderItem: {
              include: {
                product: { select: { name: true, sku: true } },
              },
            },
          },
        },
        order: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        _count: { select: { items: true } },
      },
    });

    if (!s) return { data: null, error: "Shipment not found." };

    // คำนวณ tracking URL จาก template ของ carrier
    let trackingUrl: string | null = null;
    if (s.carrier?.trackingUrl && s.trackingNumber) {
      trackingUrl = s.carrier.trackingUrl.replace(
        "{TRACKING}",
        encodeURIComponent(s.trackingNumber)
      );
    }

    const items: ShipmentLineItem[] = s.items.map((it) => ({
      id: it.id,
      orderItemId: it.orderItemId,
      productId: it.orderItem.productId,
      productName: it.orderItem.product.name,
      productSku: it.orderItem.product.sku,
      quantity: it.quantity,
      orderedQuantity: it.orderItem.quantity,
      unitPrice: dec(it.orderItem.unitPrice),
    }));

    const events: ShipmentEventItem[] = s.events.map((e) => ({
      id: e.id,
      type: e.type,
      message: e.message,
      location: e.location,
      occurredAt: e.occurredAt,
      createdAt: e.createdAt,
    }));

    const documents: ShipmentDocumentItem[] = s.documents.map((d) => ({
      id: d.id,
      type: d.type,
      fileUrl: d.fileUrl,
      documentNumber: d.documentNumber,
      notes: d.notes,
      createdAt: d.createdAt,
    }));

    const data: ShipmentDetail = {
      id: s.id,
      shipmentNumber: s.shipmentNumber,
      orderId: s.orderId,
      status: s.status,
      carrierId: s.carrier?.id ?? null,
      carrierName: s.carrier?.name ?? null,
      trackingNumber: s.trackingNumber,
      shipToName: s.shipToName,
      shipToCity: s.shipToCity,
      shippingCost: dec(s.shippingCost),
      weightKg: dec(s.weightKg),
      shippedAt: s.shippedAt,
      deliveredAt: s.deliveredAt,
      estimatedDelivery: s.estimatedDelivery,
      itemCount: s._count.items,
      createdAt: s.createdAt,
      shipToPhone: s.shipToPhone,
      shipToAddress: s.shipToAddress,
      shipToPostal: s.shipToPostal,
      shipToCountry: s.shipToCountry,
      notes: s.notes,
      trackingUrl,
      events,
      items,
      documents,
      orderTotal: dec(s.order.totalAmount),
      customerName: s.order.user.name,
      customerEmail: s.order.user.email,
    };

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getShipmentById failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load shipment.";
    return { data: null, error: message };
  }
}

export async function getShipmentSummary(): Promise<ActionResult<ShipmentSummary>> {
  try {
    const [all, pending, inTransit, delivered, failed, costAgg] =
      await Promise.all([
        prisma.shipment.count(),
        prisma.shipment.count({
          where: { status: { in: ["PENDING", "READY_TO_SHIP"] } },
        }),
        prisma.shipment.count({
          where: { status: { in: ["IN_TRANSIT", "OUT_FOR_DELIVERY"] } },
        }),
        prisma.shipment.count({ where: { status: "DELIVERED" } }),
        prisma.shipment.count({
          where: { status: { in: ["FAILED", "RETURNED"] } },
        }),
        prisma.shipment.aggregate({ _sum: { shippingCost: true } }),
      ]);

    const data: ShipmentSummary = {
      totalShipments: all,
      pending,
      inTransit,
      delivered,
      failed,
      totalCost: dec(costAgg._sum.shippingCost),
    };
    return { data, error: null };
  } catch (error: unknown) {
    console.error("getShipmentSummary failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load summary.";
    return { data: null, error: message };
  }
}

// ดึง order ที่ยัง ship ได้ + รายการ orderItem ที่เหลือต้อง ship
export interface ShippableOrderItem {
  orderItemId: string;
  productId: string;
  productName: string;
  productSku: string;
  orderedQuantity: number;
  shippedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
}

export interface ShippableOrder {
  id: string;
  customerName: string | null;
  customerEmail: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string | null;
  items: ShippableOrderItem[];
}

export async function getShippableOrders(): Promise<
  ActionResult<ShippableOrder[]>
> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["PENDING", "PROCESSING", "SHIPPED"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            customerProfile: { select: { shippingAddress: true } },
          },
        },
        items: {
          include: {
            product: { select: { name: true, sku: true } },
            shipmentItems: { select: { quantity: true } },
          },
        },
      },
    });

    const data: ShippableOrder[] = orders
      .map((o) => {
        const items: ShippableOrderItem[] = o.items.map((it) => {
          const shipped = it.shipmentItems.reduce(
            (sum, si) => sum + si.quantity,
            0
          );
          return {
            orderItemId: it.id,
            productId: it.productId,
            productName: it.product.name,
            productSku: it.product.sku,
            orderedQuantity: it.quantity,
            shippedQuantity: shipped,
            remainingQuantity: Math.max(0, it.quantity - shipped),
            unitPrice: dec(it.unitPrice),
          };
        });
        return {
          id: o.id,
          customerName: o.user.name,
          customerEmail: o.user.email,
          status: o.status,
          totalAmount: dec(o.totalAmount),
          shippingAddress: o.user.customerProfile?.shippingAddress ?? null,
          items,
        };
      })
      // กรองเหลือเฉพาะ order ที่ยังมี item รอ ship
      .filter((o) => o.items.some((it) => it.remainingQuantity > 0));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getShippableOrders failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load orders.";
    return { data: null, error: message };
  }
}

// --- Mutations ---

export async function createShipment(
  input: CreateShipmentInput
): Promise<ActionResult<{ id: string; shipmentNumber: string }>> {
  try {
    if (!input.orderId) {
      return { data: null, error: "orderId is required." };
    }
    if (!input.shipToName?.trim() || !input.shipToAddress?.trim()) {
      return {
        data: null,
        error: "Shipping name and address are required.",
      };
    }
    if (!input.items || input.items.length === 0) {
      return { data: null, error: "At least one item is required." };
    }
    if (input.items.some((it) => !it.orderItemId || it.quantity <= 0)) {
      return { data: null, error: "Item quantity must be > 0." };
    }

    // ตรวจสอบว่า orderItem ทั้งหมดเป็นของ order นี้และยังเหลือพอ ship
    const orderItems = await prisma.orderItem.findMany({
      where: {
        id: { in: input.items.map((it) => it.orderItemId) },
        orderId: input.orderId,
      },
      include: {
        shipmentItems: { select: { quantity: true } },
      },
    });

    if (orderItems.length !== input.items.length) {
      return {
        data: null,
        error: "Some order items not found or not in this order.",
      };
    }

    for (const it of input.items) {
      const oi = orderItems.find((o) => o.id === it.orderItemId);
      if (!oi) continue;
      const shipped = oi.shipmentItems.reduce((s, si) => s + si.quantity, 0);
      const remaining = oi.quantity - shipped;
      if (it.quantity > remaining) {
        return {
          data: null,
          error: `Item ${oi.id.substring(0, 6)}: only ${remaining} remaining to ship.`,
        };
      }
    }

    const shipmentNumber = await generateShipmentNumber();

    const created = await prisma.shipment.create({
      data: {
        shipmentNumber,
        orderId: input.orderId,
        carrierId: input.carrierId ?? null,
        trackingNumber: input.trackingNumber ?? null,
        shippingCost: new Prisma.Decimal(input.shippingCost ?? 0),
        weightKg: new Prisma.Decimal(input.weightKg ?? 0),
        shipToName: input.shipToName.trim(),
        shipToPhone: input.shipToPhone ?? null,
        shipToAddress: input.shipToAddress.trim(),
        shipToCity: input.shipToCity ?? null,
        shipToPostal: input.shipToPostal ?? null,
        shipToCountry: input.shipToCountry ?? null,
        estimatedDelivery: input.estimatedDelivery ?? null,
        notes: input.notes ?? null,
        createdById: input.createdById ?? null,
        items: {
          create: input.items.map((it) => ({
            orderItemId: it.orderItemId,
            quantity: it.quantity,
          })),
        },
        events: {
          create: {
            type: "CREATED",
            message: `Shipment ${shipmentNumber} created.`,
          },
        },
      },
      select: { id: true, shipmentNumber: true },
    });

    revalidatePath("/merchant/shipping");
    revalidatePath("/merchant/shipping/shipments");
    revalidatePath("/merchant/orders");
    return { data: created, error: null };
  } catch (error: unknown) {
    console.error("createShipment failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create shipment.";
    return { data: null, error: message };
  }
}

export async function updateShipment(
  id: string,
  input: UpdateShipmentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const data: Prisma.ShipmentUpdateInput = {};
    if (input.carrierId !== undefined) {
      data.carrier = input.carrierId
        ? { connect: { id: input.carrierId } }
        : { disconnect: true };
    }
    if (input.trackingNumber !== undefined)
      data.trackingNumber = input.trackingNumber;
    if (input.shippingCost !== undefined)
      data.shippingCost = new Prisma.Decimal(input.shippingCost);
    if (input.weightKg !== undefined)
      data.weightKg = new Prisma.Decimal(input.weightKg);
    if (input.shipToName !== undefined) data.shipToName = input.shipToName;
    if (input.shipToPhone !== undefined) data.shipToPhone = input.shipToPhone;
    if (input.shipToAddress !== undefined)
      data.shipToAddress = input.shipToAddress;
    if (input.shipToCity !== undefined) data.shipToCity = input.shipToCity;
    if (input.shipToPostal !== undefined) data.shipToPostal = input.shipToPostal;
    if (input.shipToCountry !== undefined)
      data.shipToCountry = input.shipToCountry;
    if (input.estimatedDelivery !== undefined)
      data.estimatedDelivery = input.estimatedDelivery;
    if (input.notes !== undefined) data.notes = input.notes;

    const updated = await prisma.shipment.update({
      where: { id },
      data,
      select: { id: true },
    });

    revalidatePath("/merchant/shipping");
    revalidatePath(`/merchant/shipping/shipments/${id}`);
    return { data: updated, error: null };
  } catch (error: unknown) {
    console.error("updateShipment failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update shipment.";
    return { data: null, error: message };
  }
}

const STATUS_TO_EVENT: Record<ShipmentStatus, ShipmentEventType> = {
  PENDING: "CREATED",
  READY_TO_SHIP: "CREATED",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  RETURNED: "RETURNED",
  CANCELLED: "CANCELLED",
};

export async function updateShipmentStatus(
  id: string,
  newStatus: ShipmentStatus,
  note?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const existing = await prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });

    if (!existing) return { data: null, error: "Shipment not found." };
    if (existing.status === newStatus) {
      return { data: { id }, error: null };
    }

    const now = new Date();
    const data: Prisma.ShipmentUpdateInput = { status: newStatus };
    // อัปเดต timestamp ตามสถานะ
    if (newStatus === "IN_TRANSIT" && !existing.shippedAt) data.shippedAt = now;
    if (newStatus === "DELIVERED" && !existing.deliveredAt)
      data.deliveredAt = now;

    await prisma.$transaction(async (tx) => {
      await tx.shipment.update({ where: { id }, data });

      await tx.shipmentEvent.create({
        data: {
          shipmentId: id,
          type: STATUS_TO_EVENT[newStatus],
          message:
            note?.trim() ||
            `Status changed from ${existing.status} to ${newStatus}.`,
          occurredAt: now,
        },
      });

      // ปรับ order.status ตามสถานะรวมของทุก shipment
      const allShipments = await tx.shipment.findMany({
        where: { orderId: existing.orderId },
        select: { status: true },
      });
      const allStatuses = allShipments.map((s) => s.status);
      // แทนที่สถานะของ shipment ปัจจุบันด้วย newStatus (เพราะ query ก่อน update)
      const derived = deriveOrderStatusFromShipments(allStatuses);
      if (derived && derived !== existing.order.status) {
        await tx.order.update({
          where: { id: existing.orderId },
          data: { status: derived },
        });
      }
    });

    // ส่ง notification ให้ลูกค้า
    await createNotification({
      userId: existing.order.user.id,
      type: "SHIPMENT_UPDATE",
      title: `Shipment ${existing.shipmentNumber} updated`,
      message: `Your shipment is now ${newStatus.replace(/_/g, " ").toLowerCase()}.`,
      link: `/merchant/shipping/shipments/${id}`,
      metadata: {
        shipmentId: id,
        previousStatus: existing.status,
        newStatus,
      },
    });

    revalidatePath("/merchant/shipping");
    revalidatePath(`/merchant/shipping/shipments/${id}`);
    revalidatePath("/merchant/orders");
    return { data: { id }, error: null };
  } catch (error: unknown) {
    console.error("updateShipmentStatus failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update status.";
    return { data: null, error: message };
  }
}

export async function addShipmentEvent(
  input: AddShipmentEventInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.shipmentId || !input.message?.trim()) {
      return { data: null, error: "Shipment and message are required." };
    }
    const event = await prisma.shipmentEvent.create({
      data: {
        shipmentId: input.shipmentId,
        type: input.type,
        message: input.message.trim(),
        location: input.location ?? null,
        occurredAt: input.occurredAt ?? new Date(),
      },
      select: { id: true },
    });

    revalidatePath(`/merchant/shipping/shipments/${input.shipmentId}`);
    return { data: event, error: null };
  } catch (error: unknown) {
    console.error("addShipmentEvent failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to add event.";
    return { data: null, error: message };
  }
}

export async function deleteShipment(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const existing = await prisma.shipment.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) return { data: null, error: "Shipment not found." };
    if (["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(existing.status)) {
      return {
        data: null,
        error: "Cannot delete shipment in transit or delivered. Cancel instead.",
      };
    }

    await prisma.shipment.delete({ where: { id } });
    revalidatePath("/merchant/shipping");
    revalidatePath("/merchant/shipping/shipments");
    return { data: { id }, error: null };
  } catch (error: unknown) {
    console.error("deleteShipment failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete shipment.";
    return { data: null, error: message };
  }
}

// --- Shipping Documents ---

export interface CreateDocumentInput {
  shipmentId: string;
  type: ShippingDocumentType;
  fileUrl?: string | null;
  notes?: string | null;
}

// generate เลขเอกสารตาม type
async function generateDocumentNumber(
  type: ShippingDocumentType
): Promise<string> {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefixMap: Record<ShippingDocumentType, string> = {
    PACKING_SLIP: "PS",
    SHIPPING_LABEL: "SL",
    COMMERCIAL_INVOICE: "CI",
    CUSTOMS_FORM: "CF",
    OTHER: "DOC",
  };
  const prefix = `${prefixMap[type]}-${yyyymm}-`;

  const last = await prisma.shippingDocument.findFirst({
    where: { documentNumber: { startsWith: prefix } },
    orderBy: { documentNumber: "desc" },
    select: { documentNumber: true },
  });

  let seq = 1;
  if (last?.documentNumber) {
    const tail = last.documentNumber.slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function createShippingDocument(
  input: CreateDocumentInput
): Promise<ActionResult<{ id: string; documentNumber: string }>> {
  try {
    if (!input.shipmentId) {
      return { data: null, error: "shipmentId is required." };
    }
    const documentNumber = await generateDocumentNumber(input.type);

    const doc = await prisma.shippingDocument.create({
      data: {
        shipmentId: input.shipmentId,
        type: input.type,
        fileUrl: input.fileUrl ?? null,
        documentNumber,
        notes: input.notes ?? null,
      },
      select: { id: true, documentNumber: true },
    });

    revalidatePath(`/merchant/shipping/shipments/${input.shipmentId}`);
    return {
      data: { id: doc.id, documentNumber: doc.documentNumber ?? documentNumber },
      error: null,
    };
  } catch (error: unknown) {
    console.error("createShippingDocument failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create document.";
    return { data: null, error: message };
  }
}

export async function deleteShippingDocument(
  id: string,
  shipmentId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await prisma.shippingDocument.delete({ where: { id } });
    revalidatePath(`/merchant/shipping/shipments/${shipmentId}`);
    return { data: { id }, error: null };
  } catch (error: unknown) {
    console.error("deleteShippingDocument failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete document.";
    return { data: null, error: message };
  }
}
