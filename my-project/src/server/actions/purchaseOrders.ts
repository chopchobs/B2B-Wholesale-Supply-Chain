"use server";

import { prisma } from "@/lib/prisma";
import {
  Prisma,
  PurchaseOrderStatus,
  InboundShipmentStatus,
  InventoryTransactionType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface PurchaseOrderListItem {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  expectedDelivery: Date | null;
  subtotal: number;
  total: number;
  notes: string | null;
  createdAt: Date;
  supplierId: string;
  supplier: {
    id: string;
    name: string;
    email: string | null;
  };
  itemCount: number;
}

export interface PurchaseOrderLineItem {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  total: number;
  product: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface InboundShipmentItem {
  id: string;
  trackingNumber: string | null;
  carrier: string | null;
  shippedAt: Date | null;
  receivedAt: Date | null;
  status: InboundShipmentStatus;
  createdAt: Date;
}

export interface PurchaseOrderDetail
  extends Omit<PurchaseOrderListItem, "itemCount"> {
  items: PurchaseOrderLineItem[];
  shipments: InboundShipmentItem[];
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  expectedDelivery?: Date | string | null;
  notes?: string | null;
  items: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
  }>;
}

export interface CreateInboundShipmentInput {
  trackingNumber?: string | null;
  carrier?: string | null;
  shippedAt?: Date | string | null;
  status?: InboundShipmentStatus;
}

export interface PurchaseOrderFilter {
  status?: PurchaseOrderStatus | "ALL";
  supplierId?: string;
}

// --- Helpers ---

function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

// สร้างเลข PO รูปแบบ PO-YYYYMM-XXXX (sequence รายเดือน)
async function generatePoNumber(now: Date = new Date()): Promise<string> {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `PO-${y}${m}-`;

  const last = await prisma.purchaseOrder.findFirst({
    where: { poNumber: { startsWith: prefix } },
    orderBy: { poNumber: "desc" },
    select: { poNumber: true },
  });

  let nextSeq = 1;
  if (last?.poNumber) {
    const tail = last.poNumber.slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (!Number.isNaN(parsed)) nextSeq = parsed + 1;
  }
  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// --- Queries ---

export async function getPurchaseOrders(
  filter?: PurchaseOrderFilter
): Promise<ActionResult<PurchaseOrderListItem[]>> {
  try {
    const where: Prisma.PurchaseOrderWhereInput = {};
    if (filter?.status && filter.status !== "ALL") {
      where.status = filter.status;
    }
    if (filter?.supplierId) {
      where.supplierId = filter.supplierId;
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
      },
    });

    const data: PurchaseOrderListItem[] = orders.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      expectedDelivery: po.expectedDelivery,
      subtotal: dec(po.subtotal),
      total: dec(po.total),
      notes: po.notes,
      createdAt: po.createdAt,
      supplierId: po.supplierId,
      supplier: po.supplier,
      itemCount: po._count.items,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getPurchaseOrders failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load purchase orders.";
    return { data: null, error: message };
  }
}

export async function getPurchaseOrderById(
  id: string
): Promise<ActionResult<PurchaseOrderDetail>> {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        shipments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!po) {
      return { data: null, error: "Purchase order not found." };
    }

    const detail: PurchaseOrderDetail = {
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      expectedDelivery: po.expectedDelivery,
      subtotal: dec(po.subtotal),
      total: dec(po.total),
      notes: po.notes,
      createdAt: po.createdAt,
      supplierId: po.supplierId,
      supplier: po.supplier,
      items: po.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        quantity: it.quantity,
        unitCost: dec(it.unitCost),
        total: dec(it.total),
        product: it.product,
      })),
      shipments: po.shipments.map((sh) => ({
        id: sh.id,
        trackingNumber: sh.trackingNumber,
        carrier: sh.carrier,
        shippedAt: sh.shippedAt,
        receivedAt: sh.receivedAt,
        status: sh.status,
        createdAt: sh.createdAt,
      })),
    };

    return { data: detail, error: null };
  } catch (error: unknown) {
    console.error("getPurchaseOrderById failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load purchase order.";
    return { data: null, error: message };
  }
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput
): Promise<ActionResult<PurchaseOrderListItem>> {
  try {
    if (!input.supplierId) {
      return { data: null, error: "Supplier is required." };
    }
    if (!input.items || input.items.length === 0) {
      return { data: null, error: "At least one line item is required." };
    }

    // ตรวจ supplier มีจริง
    const supplier = await prisma.supplier.findUnique({
      where: { id: input.supplierId },
      select: { id: true, status: true },
    });
    if (!supplier) {
      return { data: null, error: "Supplier not found." };
    }

    // คำนวณ subtotal/total + validate items
    let subtotal = 0;
    for (const it of input.items) {
      if (!it.productId) {
        return { data: null, error: "Product is required for every item." };
      }
      if (!Number.isFinite(it.quantity) || it.quantity <= 0) {
        return {
          data: null,
          error: "Quantity must be greater than 0 for every item.",
        };
      }
      if (!Number.isFinite(it.unitCost) || it.unitCost < 0) {
        return { data: null, error: "Unit cost must be 0 or greater." };
      }
      subtotal += it.quantity * it.unitCost;
    }
    subtotal = round2(subtotal);
    const total = subtotal;

    const now = new Date();
    const poNumber = await generatePoNumber(now);

    const created = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: input.supplierId,
        status: PurchaseOrderStatus.DRAFT,
        expectedDelivery: input.expectedDelivery
          ? new Date(input.expectedDelivery)
          : null,
        notes: input.notes?.trim() || null,
        subtotal: new Prisma.Decimal(subtotal),
        total: new Prisma.Decimal(total),
        items: {
          create: input.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitCost: new Prisma.Decimal(it.unitCost),
            total: new Prisma.Decimal(round2(it.quantity * it.unitCost)),
          })),
        },
      },
      include: {
        supplier: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
      },
    });

    revalidatePath("/merchant/purchase-orders");
    revalidatePath("/merchant/suppliers");
    revalidatePath(`/merchant/suppliers/${input.supplierId}`);
    revalidatePath("/merchant");

    return {
      data: {
        id: created.id,
        poNumber: created.poNumber,
        status: created.status,
        expectedDelivery: created.expectedDelivery,
        subtotal: dec(created.subtotal),
        total: dec(created.total),
        notes: created.notes,
        createdAt: created.createdAt,
        supplierId: created.supplierId,
        supplier: created.supplier,
        itemCount: created._count.items,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("createPurchaseOrder failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create purchase order.";
    return { data: null, error: message };
  }
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus
): Promise<ActionResult<PurchaseOrderListItem>> {
  try {
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: {
        supplier: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
      },
    });

    revalidatePath("/merchant/purchase-orders");
    revalidatePath(`/merchant/purchase-orders/${id}`);
    revalidatePath("/merchant/suppliers");
    revalidatePath(`/merchant/suppliers/${updated.supplierId}`);
    revalidatePath("/merchant");

    return {
      data: {
        id: updated.id,
        poNumber: updated.poNumber,
        status: updated.status,
        expectedDelivery: updated.expectedDelivery,
        subtotal: dec(updated.subtotal),
        total: dec(updated.total),
        notes: updated.notes,
        createdAt: updated.createdAt,
        supplierId: updated.supplierId,
        supplier: updated.supplier,
        itemCount: updated._count.items,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("updatePurchaseOrderStatus failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update purchase order status.";
    return { data: null, error: message };
  }
}

export async function createInboundShipment(
  poId: string,
  data: CreateInboundShipmentInput
): Promise<ActionResult<InboundShipmentItem>> {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      select: { id: true, status: true, supplierId: true },
    });
    if (!po) {
      return { data: null, error: "Purchase order not found." };
    }

    const created = await prisma.inboundShipment.create({
      data: {
        purchaseOrderId: poId,
        trackingNumber: data.trackingNumber?.trim() || null,
        carrier: data.carrier?.trim() || null,
        shippedAt: data.shippedAt ? new Date(data.shippedAt) : null,
        status: data.status ?? InboundShipmentStatus.IN_TRANSIT,
      },
    });

    // ถ้า PO ยังเป็น DRAFT/SENT ให้ขยับเป็น CONFIRMED เพื่อสะท้อนว่ามี shipment แล้ว
    if (
      po.status === PurchaseOrderStatus.DRAFT ||
      po.status === PurchaseOrderStatus.SENT
    ) {
      await prisma.purchaseOrder.update({
        where: { id: poId },
        data: { status: PurchaseOrderStatus.CONFIRMED },
      });
    }

    revalidatePath("/merchant/purchase-orders");
    revalidatePath(`/merchant/purchase-orders/${poId}`);
    revalidatePath("/merchant/suppliers");
    revalidatePath(`/merchant/suppliers/${po.supplierId}`);
    revalidatePath("/merchant");

    return {
      data: {
        id: created.id,
        trackingNumber: created.trackingNumber,
        carrier: created.carrier,
        shippedAt: created.shippedAt,
        receivedAt: created.receivedAt,
        status: created.status,
        createdAt: created.createdAt,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("createInboundShipment failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create shipment.";
    return { data: null, error: message };
  }
}

export async function receivePurchaseOrder(
  poId: string
): Promise<ActionResult<PurchaseOrderListItem>> {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: true,
      },
    });

    if (!po) {
      return { data: null, error: "Purchase order not found." };
    }
    if (po.status === PurchaseOrderStatus.RECEIVED) {
      return { data: null, error: "Purchase order is already received." };
    }
    if (po.status === PurchaseOrderStatus.CANCELLED) {
      return {
        data: null,
        error: "Cannot receive a cancelled purchase order.",
      };
    }
    if (po.items.length === 0) {
      return { data: null, error: "Purchase order has no items to receive." };
    }

    // ทำ transaction: mark RECEIVED, update shipments, restock InventoryItem
    const updated = await prisma.$transaction(async (tx) => {
      // 1) update PO status + ทุก shipment ที่ยัง IN_TRANSIT ให้ DELIVERED
      const now = new Date();
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: PurchaseOrderStatus.RECEIVED },
      });

      await tx.inboundShipment.updateMany({
        where: {
          purchaseOrderId: poId,
          status: InboundShipmentStatus.IN_TRANSIT,
        },
        data: { status: InboundShipmentStatus.DELIVERED, receivedAt: now },
      });

      // 2) เพิ่มสต็อกผ่าน InventoryItem (สร้างถ้ายังไม่มี) + log InventoryTransaction RESTOCK
      for (const item of po.items) {
        const existing = await tx.inventoryItem.findUnique({
          where: { productId: item.productId },
        });

        let inventoryItemId: string;
        if (existing) {
          const updatedInv = await tx.inventoryItem.update({
            where: { productId: item.productId },
            data: { quantity: { increment: item.quantity } },
          });
          inventoryItemId = updatedInv.id;
        } else {
          const createdInv = await tx.inventoryItem.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
            },
          });
          inventoryItemId = createdInv.id;
        }

        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId,
            type: InventoryTransactionType.RESTOCK,
            quantityDelta: item.quantity,
            note: `Received PO ${po.poNumber}`,
          },
        });

        // อัปเดต Product.stock ให้สอดคล้องด้วย (legacy field)
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.purchaseOrder.findUniqueOrThrow({
        where: { id: poId },
        include: {
          supplier: { select: { id: true, name: true, email: true } },
          _count: { select: { items: true } },
        },
      });
    });

    revalidatePath("/merchant/purchase-orders");
    revalidatePath(`/merchant/purchase-orders/${poId}`);
    revalidatePath("/merchant/suppliers");
    revalidatePath(`/merchant/suppliers/${updated.supplierId}`);
    revalidatePath("/merchant/inventory");
    revalidatePath("/merchant");

    return {
      data: {
        id: updated.id,
        poNumber: updated.poNumber,
        status: updated.status,
        expectedDelivery: updated.expectedDelivery,
        subtotal: dec(updated.subtotal),
        total: dec(updated.total),
        notes: updated.notes,
        createdAt: updated.createdAt,
        supplierId: updated.supplierId,
        supplier: updated.supplier,
        itemCount: updated._count.items,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("receivePurchaseOrder failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to receive purchase order.";
    return { data: null, error: message };
  }
}
