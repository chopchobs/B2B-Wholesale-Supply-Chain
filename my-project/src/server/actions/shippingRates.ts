"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface ShippingZoneListItem {
  id: string;
  name: string;
  regions: unknown;
  description: string | null;
  isActive: boolean;
  rateCount: number;
  createdAt: Date;
}

export interface CreateZoneInput {
  name: string;
  regions?: string[] | null;
  description?: string | null;
}

export interface UpdateZoneInput extends Partial<CreateZoneInput> {
  isActive?: boolean;
}

export interface ShippingRateListItem {
  id: string;
  carrierId: string;
  carrierName: string;
  carrierCode: string;
  zoneId: string;
  zoneName: string;
  serviceName: string;
  baseRate: number;
  perKgRate: number;
  minWeightKg: number;
  estimatedDays: number | null;
  isActive: boolean;
}

export interface CreateRateInput {
  carrierId: string;
  zoneId: string;
  serviceName: string;
  baseRate: number;
  perKgRate?: number;
  minWeightKg?: number;
  estimatedDays?: number | null;
}

export interface UpdateRateInput extends Partial<CreateRateInput> {
  isActive?: boolean;
}

// --- Helpers ---

function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

// --- Zone Queries ---

export async function getShippingZones(): Promise<
  ActionResult<ShippingZoneListItem[]>
> {
  try {
    const zones = await prisma.shippingZone.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { rates: true } } },
    });

    const data: ShippingZoneListItem[] = zones.map((z) => ({
      id: z.id,
      name: z.name,
      regions: z.regions,
      description: z.description,
      isActive: z.isActive,
      rateCount: z._count.rates,
      createdAt: z.createdAt,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getShippingZones failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load zones.";
    return { data: null, error: message };
  }
}

export async function createShippingZone(
  input: CreateZoneInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.name?.trim()) {
      return { data: null, error: "Zone name is required." };
    }

    const zone = await prisma.shippingZone.create({
      data: {
        name: input.name.trim(),
        regions: input.regions ?? Prisma.JsonNull,
        description: input.description ?? null,
      },
      select: { id: true },
    });

    revalidatePath("/merchant/shipping/rates");
    return { data: zone, error: null };
  } catch (error: unknown) {
    console.error("createShippingZone failed:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { data: null, error: "Zone name already exists." };
    }
    const message =
      error instanceof Error ? error.message : "Failed to create zone.";
    return { data: null, error: message };
  }
}

export async function updateShippingZone(
  id: string,
  input: UpdateZoneInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const data: Prisma.ShippingZoneUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.regions !== undefined)
      data.regions = input.regions ?? Prisma.JsonNull;
    if (input.description !== undefined) data.description = input.description;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const zone = await prisma.shippingZone.update({
      where: { id },
      data,
      select: { id: true },
    });

    revalidatePath("/merchant/shipping/rates");
    return { data: zone, error: null };
  } catch (error: unknown) {
    console.error("updateShippingZone failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update zone.";
    return { data: null, error: message };
  }
}

export async function deleteShippingZone(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const rateCount = await prisma.shippingRate.count({ where: { zoneId: id } });
    if (rateCount > 0) {
      return {
        data: null,
        error: `Cannot delete zone — ${rateCount} rate(s) reference it. Deactivate instead.`,
      };
    }
    await prisma.shippingZone.delete({ where: { id } });
    revalidatePath("/merchant/shipping/rates");
    return { data: { id }, error: null };
  } catch (error: unknown) {
    console.error("deleteShippingZone failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete zone.";
    return { data: null, error: message };
  }
}

// --- Rate Queries ---

export async function getShippingRates(): Promise<
  ActionResult<ShippingRateListItem[]>
> {
  try {
    const rates = await prisma.shippingRate.findMany({
      orderBy: [{ carrier: { name: "asc" } }, { zone: { name: "asc" } }],
      include: {
        carrier: { select: { id: true, name: true, code: true } },
        zone: { select: { id: true, name: true } },
      },
    });

    const data: ShippingRateListItem[] = rates.map((r) => ({
      id: r.id,
      carrierId: r.carrier.id,
      carrierName: r.carrier.name,
      carrierCode: r.carrier.code,
      zoneId: r.zone.id,
      zoneName: r.zone.name,
      serviceName: r.serviceName,
      baseRate: dec(r.baseRate),
      perKgRate: dec(r.perKgRate),
      minWeightKg: dec(r.minWeightKg),
      estimatedDays: r.estimatedDays,
      isActive: r.isActive,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getShippingRates failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load rates.";
    return { data: null, error: message };
  }
}

export async function createShippingRate(
  input: CreateRateInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.carrierId || !input.zoneId || !input.serviceName?.trim()) {
      return { data: null, error: "Carrier, zone, and service are required." };
    }
    if (input.baseRate == null || input.baseRate < 0) {
      return { data: null, error: "Base rate must be >= 0." };
    }

    const rate = await prisma.shippingRate.create({
      data: {
        carrierId: input.carrierId,
        zoneId: input.zoneId,
        serviceName: input.serviceName.trim(),
        baseRate: new Prisma.Decimal(input.baseRate),
        perKgRate: new Prisma.Decimal(input.perKgRate ?? 0),
        minWeightKg: new Prisma.Decimal(input.minWeightKg ?? 0),
        estimatedDays: input.estimatedDays ?? null,
      },
      select: { id: true },
    });

    revalidatePath("/merchant/shipping/rates");
    return { data: rate, error: null };
  } catch (error: unknown) {
    console.error("createShippingRate failed:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        data: null,
        error: "Rate for this carrier/zone/service already exists.",
      };
    }
    const message =
      error instanceof Error ? error.message : "Failed to create rate.";
    return { data: null, error: message };
  }
}

export async function updateShippingRate(
  id: string,
  input: UpdateRateInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const data: Prisma.ShippingRateUpdateInput = {};
    if (input.serviceName !== undefined)
      data.serviceName = input.serviceName.trim();
    if (input.baseRate !== undefined)
      data.baseRate = new Prisma.Decimal(input.baseRate);
    if (input.perKgRate !== undefined)
      data.perKgRate = new Prisma.Decimal(input.perKgRate);
    if (input.minWeightKg !== undefined)
      data.minWeightKg = new Prisma.Decimal(input.minWeightKg);
    if (input.estimatedDays !== undefined)
      data.estimatedDays = input.estimatedDays;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const rate = await prisma.shippingRate.update({
      where: { id },
      data,
      select: { id: true },
    });

    revalidatePath("/merchant/shipping/rates");
    return { data: rate, error: null };
  } catch (error: unknown) {
    console.error("updateShippingRate failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update rate.";
    return { data: null, error: message };
  }
}

export async function deleteShippingRate(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await prisma.shippingRate.delete({ where: { id } });
    revalidatePath("/merchant/shipping/rates");
    return { data: { id }, error: null };
  } catch (error: unknown) {
    console.error("deleteShippingRate failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete rate.";
    return { data: null, error: message };
  }
}

// --- Quote calculation ---

export interface RateQuoteInput {
  zoneId: string;
  weightKg: number;
  carrierId?: string;
}

export interface RateQuoteItem {
  rateId: string;
  carrierId: string;
  carrierName: string;
  serviceName: string;
  estimatedDays: number | null;
  totalCost: number;
}

export async function quoteShippingRates(
  input: RateQuoteInput
): Promise<ActionResult<RateQuoteItem[]>> {
  try {
    if (!input.zoneId) {
      return { data: null, error: "zoneId is required." };
    }
    const weight = Math.max(0, input.weightKg ?? 0);

    const rates = await prisma.shippingRate.findMany({
      where: {
        zoneId: input.zoneId,
        isActive: true,
        carrier: { status: "ACTIVE" },
        ...(input.carrierId ? { carrierId: input.carrierId } : {}),
      },
      include: { carrier: true },
    });

    const data: RateQuoteItem[] = rates.map((r) => {
      const base = dec(r.baseRate);
      const min = dec(r.minWeightKg);
      const perKg = dec(r.perKgRate);
      // คำนวณ: ถ้า weight เกิน minWeight → คิดเพิ่มต่อ kg
      const extra = weight > min ? (weight - min) * perKg : 0;
      const total = base + extra;
      return {
        rateId: r.id,
        carrierId: r.carrier.id,
        carrierName: r.carrier.name,
        serviceName: r.serviceName,
        estimatedDays: r.estimatedDays,
        totalCost: Math.round(total * 100) / 100,
      };
    });

    data.sort((a, b) => a.totalCost - b.totalCost);
    return { data, error: null };
  } catch (error: unknown) {
    console.error("quoteShippingRates failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to quote rates.";
    return { data: null, error: message };
  }
}
