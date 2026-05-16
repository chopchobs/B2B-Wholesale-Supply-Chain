"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, CarrierStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface CarrierListItem {
  id: string;
  name: string;
  code: string;
  trackingUrl: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  status: CarrierStatus;
  notes: string | null;
  shipmentCount: number;
  rateCount: number;
  createdAt: Date;
}

export interface CreateCarrierInput {
  name: string;
  code: string;
  trackingUrl?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
}

export interface UpdateCarrierInput extends Partial<CreateCarrierInput> {
  status?: CarrierStatus;
}

export interface CarrierFilter {
  status?: CarrierStatus | "ALL";
  search?: string;
}

// --- Queries ---

export async function getCarriers(
  filter?: CarrierFilter
): Promise<ActionResult<CarrierListItem[]>> {
  try {
    const where: Prisma.CarrierWhereInput = {};
    if (filter?.status && filter.status !== "ALL") {
      where.status = filter.status;
    }
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: "insensitive" } },
        { code: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    const carriers = await prisma.carrier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { shipments: true, rates: true } },
      },
    });

    const data: CarrierListItem[] = carriers.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      trackingUrl: c.trackingUrl,
      contactName: c.contactName,
      contactPhone: c.contactPhone,
      contactEmail: c.contactEmail,
      status: c.status,
      notes: c.notes,
      shipmentCount: c._count.shipments,
      rateCount: c._count.rates,
      createdAt: c.createdAt,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getCarriers failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load carriers.";
    return { data: null, error: message };
  }
}

export async function getActiveCarriers(): Promise<
  ActionResult<{ id: string; name: string; code: string }[]>
> {
  try {
    const carriers = await prisma.carrier.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    });
    return { data: carriers, error: null };
  } catch (error: unknown) {
    console.error("getActiveCarriers failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load carriers.";
    return { data: null, error: message };
  }
}

// --- Mutations ---

export async function createCarrier(
  input: CreateCarrierInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.name?.trim() || !input.code?.trim()) {
      return { data: null, error: "Name and code are required." };
    }

    const carrier = await prisma.carrier.create({
      data: {
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        trackingUrl: input.trackingUrl ?? null,
        contactName: input.contactName ?? null,
        contactPhone: input.contactPhone ?? null,
        contactEmail: input.contactEmail ?? null,
        notes: input.notes ?? null,
      },
      select: { id: true },
    });

    revalidatePath("/merchant/shipping");
    revalidatePath("/merchant/shipping/carriers");
    return { data: carrier, error: null };
  } catch (error: unknown) {
    console.error("createCarrier failed:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { data: null, error: "Carrier code already exists." };
    }
    const message =
      error instanceof Error ? error.message : "Failed to create carrier.";
    return { data: null, error: message };
  }
}

export async function updateCarrier(
  id: string,
  input: UpdateCarrierInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const data: Prisma.CarrierUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.code !== undefined) data.code = input.code.trim().toUpperCase();
    if (input.trackingUrl !== undefined) data.trackingUrl = input.trackingUrl;
    if (input.contactName !== undefined) data.contactName = input.contactName;
    if (input.contactPhone !== undefined) data.contactPhone = input.contactPhone;
    if (input.contactEmail !== undefined) data.contactEmail = input.contactEmail;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.status !== undefined) data.status = input.status;

    const carrier = await prisma.carrier.update({
      where: { id },
      data,
      select: { id: true },
    });

    revalidatePath("/merchant/shipping");
    revalidatePath("/merchant/shipping/carriers");
    return { data: carrier, error: null };
  } catch (error: unknown) {
    console.error("updateCarrier failed:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { data: null, error: "Carrier code already exists." };
    }
    const message =
      error instanceof Error ? error.message : "Failed to update carrier.";
    return { data: null, error: message };
  }
}

export async function deleteCarrier(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    // ไม่ลบจริงถ้ามี shipment ใช้งานอยู่ — soft inactivate แทน
    const usage = await prisma.shipment.count({ where: { carrierId: id } });
    if (usage > 0) {
      await prisma.carrier.update({
        where: { id },
        data: { status: "INACTIVE" },
      });
      revalidatePath("/merchant/shipping/carriers");
      return { data: { id }, error: null };
    }

    await prisma.carrier.delete({ where: { id } });
    revalidatePath("/merchant/shipping/carriers");
    return { data: { id }, error: null };
  } catch (error: unknown) {
    console.error("deleteCarrier failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete carrier.";
    return { data: null, error: message };
  }
}
