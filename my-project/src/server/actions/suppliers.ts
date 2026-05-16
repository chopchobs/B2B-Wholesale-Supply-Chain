"use server";

import { prisma } from "@/lib/prisma";
import {
  Prisma,
  SupplierStatus,
  PurchaseOrderStatus,
  InboundShipmentStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface SupplierListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  contactPerson: string | null;
  website: string | null;
  status: SupplierStatus;
  notes: string | null;
  createdAt: Date;
  poCount: number;
  lastOrderAt: Date | null;
}

export interface SupplierPurchaseOrderItem {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  total: number;
  expectedDelivery: Date | null;
  createdAt: Date;
}

export interface SupplierShipmentItem {
  id: string;
  poNumber: string;
  trackingNumber: string | null;
  carrier: string | null;
  status: InboundShipmentStatus;
  shippedAt: Date | null;
  receivedAt: Date | null;
}

export interface SupplierDetail extends SupplierListItem {
  purchaseOrders: SupplierPurchaseOrderItem[];
  shipments: SupplierShipmentItem[];
}

export interface SupplierSummary {
  activeSuppliers: number;
  pendingPOs: number;
  inTransitShipments: number;
}

export interface CreateSupplierInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  website?: string | null;
  notes?: string | null;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  status?: SupplierStatus;
}

export interface SupplierFilter {
  status?: SupplierStatus | "ALL";
  search?: string;
}

// --- Helpers ---

function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

// --- Queries ---

export async function getSuppliers(
  filter?: SupplierFilter
): Promise<ActionResult<SupplierListItem[]>> {
  try {
    const where: Prisma.SupplierWhereInput = {};
    if (filter?.status && filter.status !== "ALL") {
      where.status = filter.status;
    }
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: "insensitive" } },
        { email: { contains: filter.search, mode: "insensitive" } },
        { contactPerson: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        purchaseOrders: {
          select: { id: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { purchaseOrders: true } },
      },
    });

    const data: SupplierListItem[] = suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      address: s.address,
      contactPerson: s.contactPerson,
      website: s.website,
      status: s.status,
      notes: s.notes,
      createdAt: s.createdAt,
      poCount: s._count.purchaseOrders,
      lastOrderAt: s.purchaseOrders[0]?.createdAt ?? null,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getSuppliers failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load suppliers.";
    return { data: null, error: message };
  }
}

export async function getSupplierById(
  id: string
): Promise<ActionResult<SupplierDetail>> {
  try {
    const s = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
          include: {
            shipments: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });

    if (!s) {
      return { data: null, error: "Supplier not found." };
    }

    const purchaseOrders: SupplierPurchaseOrderItem[] = s.purchaseOrders.map(
      (po) => ({
        id: po.id,
        poNumber: po.poNumber,
        status: po.status,
        total: dec(po.total),
        expectedDelivery: po.expectedDelivery,
        createdAt: po.createdAt,
      })
    );

    // รวม shipment ของทุก PO ของ supplier นี้
    const shipments: SupplierShipmentItem[] = s.purchaseOrders.flatMap((po) =>
      po.shipments.map((sh) => ({
        id: sh.id,
        poNumber: po.poNumber,
        trackingNumber: sh.trackingNumber,
        carrier: sh.carrier,
        status: sh.status,
        shippedAt: sh.shippedAt,
        receivedAt: sh.receivedAt,
      }))
    );

    const detail: SupplierDetail = {
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      address: s.address,
      contactPerson: s.contactPerson,
      website: s.website,
      status: s.status,
      notes: s.notes,
      createdAt: s.createdAt,
      poCount: s.purchaseOrders.length,
      lastOrderAt: s.purchaseOrders[0]?.createdAt ?? null,
      purchaseOrders,
      shipments,
    };

    return { data: detail, error: null };
  } catch (error: unknown) {
    console.error("getSupplierById failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load supplier.";
    return { data: null, error: message };
  }
}

export async function createSupplier(
  input: CreateSupplierInput
): Promise<ActionResult<SupplierListItem>> {
  try {
    if (!input.name || input.name.trim().length === 0) {
      return { data: null, error: "Supplier name is required." };
    }

    const created = await prisma.supplier.create({
      data: {
        name: input.name.trim(),
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        contactPerson: input.contactPerson?.trim() || null,
        website: input.website?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });

    revalidatePath("/merchant/suppliers");
    revalidatePath("/merchant");

    return {
      data: {
        id: created.id,
        name: created.name,
        email: created.email,
        phone: created.phone,
        address: created.address,
        contactPerson: created.contactPerson,
        website: created.website,
        status: created.status,
        notes: created.notes,
        createdAt: created.createdAt,
        poCount: 0,
        lastOrderAt: null,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("createSupplier failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create supplier.";
    return { data: null, error: message };
  }
}

export async function updateSupplier(
  id: string,
  input: UpdateSupplierInput
): Promise<ActionResult<SupplierListItem>> {
  try {
    const data: Prisma.SupplierUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.email !== undefined) data.email = input.email?.trim() || null;
    if (input.phone !== undefined) data.phone = input.phone?.trim() || null;
    if (input.address !== undefined)
      data.address = input.address?.trim() || null;
    if (input.contactPerson !== undefined)
      data.contactPerson = input.contactPerson?.trim() || null;
    if (input.website !== undefined)
      data.website = input.website?.trim() || null;
    if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
    if (input.status !== undefined) data.status = input.status;

    const updated = await prisma.supplier.update({
      where: { id },
      data,
      include: {
        purchaseOrders: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { purchaseOrders: true } },
      },
    });

    revalidatePath("/merchant/suppliers");
    revalidatePath(`/merchant/suppliers/${id}`);
    revalidatePath("/merchant");

    return {
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        contactPerson: updated.contactPerson,
        website: updated.website,
        status: updated.status,
        notes: updated.notes,
        createdAt: updated.createdAt,
        poCount: updated._count.purchaseOrders,
        lastOrderAt: updated.purchaseOrders[0]?.createdAt ?? null,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("updateSupplier failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update supplier.";
    return { data: null, error: message };
  }
}

export async function getSupplierSummary(): Promise<
  ActionResult<SupplierSummary>
> {
  try {
    const [activeSuppliers, pendingPOs, inTransitShipments] = await Promise.all(
      [
        prisma.supplier.count({ where: { status: SupplierStatus.ACTIVE } }),
        prisma.purchaseOrder.count({
          where: {
            status: {
              in: [
                PurchaseOrderStatus.DRAFT,
                PurchaseOrderStatus.SENT,
                PurchaseOrderStatus.CONFIRMED,
              ],
            },
          },
        }),
        prisma.inboundShipment.count({
          where: { status: InboundShipmentStatus.IN_TRANSIT },
        }),
      ]
    );

    return {
      data: { activeSuppliers, pendingPOs, inTransitShipments },
      error: null,
    };
  } catch (error: unknown) {
    console.error("getSupplierSummary failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load supplier summary.";
    return { data: null, error: message };
  }
}
