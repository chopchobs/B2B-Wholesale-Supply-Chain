"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, InventoryTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export type WarehouseInventoryStatus = "OK" | "LOW" | "OUT";

export interface WarehouseListItem {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  country: string | null;
  isActive: boolean;
  isDefault: boolean;
  capacity: number | null;
  itemCount: number;
  totalStock: number;
}

export interface WarehouseDetail {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  country: string | null;
  isActive: boolean;
  isDefault: boolean;
  capacity: number | null;
  notes: string | null;
  itemCount: number;
  totalStock: number;
}

export interface WarehouseInventoryRow {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  lowStockThreshold: number;
  status: WarehouseInventoryStatus;
}

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

export interface TransferProductOption {
  inventoryItemId: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
}

// --- Helpers ---

// คำนวณสถานะสต็อกตาม threshold
function resolveStatus(qty: number, threshold: number): WarehouseInventoryStatus {
  if (qty <= 0) return "OUT";
  if (qty <= threshold) return "LOW";
  return "OK";
}

// --- Zod schemas ---

const createWarehouseSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  location: z.string().max(500).optional().nullable(),
  capacity: z.number().int().nonnegative().optional().nullable(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;

const transferStockSchema = z.object({
  fromWarehouseId: z.string().min(1, "Source warehouse is required."),
  toWarehouseId: z.string().min(1, "Destination warehouse is required."),
  productId: z.string().min(1, "Product is required."),
  quantity: z.number().int().positive("Quantity must be greater than 0."),
});

export type TransferStockInput = z.infer<typeof transferStockSchema>;

// สร้าง warehouse code อัตโนมัติจากชื่อ ถ้าเจอซ้ำให้ต่อท้าย -2, -3 ...
async function generateUniqueCode(name: string): Promise<string> {
  const base =
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 16) || "WH";

  let candidate = base;
  let suffix = 2;
  // ลูปหา code ที่ยังไม่ซ้ำ (กันชนกัน)
  while (await prisma.warehouse.findUnique({ where: { code: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
    if (suffix > 999) {
      candidate = `${base}-${Date.now()}`;
      break;
    }
  }
  return candidate;
}

// --- Queries ---

export async function listWarehouses(): Promise<ActionResult<WarehouseListItem[]>> {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    // ดึง inventory แล้ว group ตาม warehouseId
    const inventoryItems = await prisma.inventoryItem.findMany({
      select: { warehouseId: true, quantity: true },
    });

    const grouped = new Map<string, { count: number; total: number }>();
    for (const i of inventoryItems) {
      if (!i.warehouseId) continue;
      const prev = grouped.get(i.warehouseId) ?? { count: 0, total: 0 };
      grouped.set(i.warehouseId, {
        count: prev.count + 1,
        total: prev.total + i.quantity,
      });
    }

    const data: WarehouseListItem[] = warehouses.map((w) => {
      const stats = grouped.get(w.id) ?? { count: 0, total: 0 };
      return {
        id: w.id,
        name: w.name,
        code: w.code,
        address: w.address,
        city: w.city,
        country: w.country,
        isActive: w.isActive,
        isDefault: w.isDefault,
        capacity: w.capacity,
        itemCount: stats.count,
        totalStock: stats.total,
      };
    });

    return { data, error: null };
  } catch (error: unknown) {
    console.error("listWarehouses failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load warehouses.";
    return { data: null, error: message };
  }
}

export async function getWarehouseById(
  id: string
): Promise<ActionResult<WarehouseDetail>> {
  try {
    if (!id) {
      return { data: null, error: "Warehouse id is required." };
    }
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      return { data: null, error: "Warehouse not found." };
    }

    const items = await prisma.inventoryItem.findMany({
      where: { warehouseId: id },
      select: { quantity: true },
    });

    const itemCount = items.length;
    const totalStock = items.reduce((acc, i) => acc + i.quantity, 0);

    return {
      data: {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address,
        city: warehouse.city,
        country: warehouse.country,
        isActive: warehouse.isActive,
        isDefault: warehouse.isDefault,
        capacity: warehouse.capacity,
        notes: warehouse.notes,
        itemCount,
        totalStock,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("getWarehouseById failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load warehouse.";
    return { data: null, error: message };
  }
}

export async function getWarehouseInventory(
  warehouseId: string
): Promise<ActionResult<WarehouseInventoryRow[]>> {
  try {
    if (!warehouseId) {
      return { data: null, error: "Warehouse id is required." };
    }
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { id: true },
    });
    if (!warehouse) {
      return { data: null, error: "Warehouse not found." };
    }

    const items = await prisma.inventoryItem.findMany({
      where: { warehouseId },
      orderBy: { updatedAt: "desc" },
      include: { product: { select: { sku: true, name: true } } },
    });

    const data: WarehouseInventoryRow[] = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.product.sku,
      productName: item.product.name,
      quantity: item.quantity,
      lowStockThreshold: item.lowStockThreshold,
      status: resolveStatus(item.quantity, item.lowStockThreshold),
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getWarehouseInventory failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load inventory.";
    return { data: null, error: message };
  }
}

// list สำหรับ dropdown (ใช้ทั้งในหน้า transfer)
export async function listWarehouseOptions(): Promise<
  ActionResult<WarehouseOption[]>
> {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    });
    return { data: warehouses, error: null };
  } catch (error: unknown) {
    console.error("listWarehouseOptions failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load warehouses.";
    return { data: null, error: message };
  }
}

// list สินค้าใน warehouse ต้นทาง (สำหรับ transfer form)
export async function listTransferableProducts(
  warehouseId: string
): Promise<ActionResult<TransferProductOption[]>> {
  try {
    if (!warehouseId) {
      return { data: null, error: "Warehouse id is required." };
    }
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { id: true },
    });
    if (!warehouse) {
      return { data: null, error: "Warehouse not found." };
    }

    const items = await prisma.inventoryItem.findMany({
      where: { warehouseId, quantity: { gt: 0 } },
      orderBy: { updatedAt: "desc" },
      include: { product: { select: { sku: true, name: true } } },
    });

    const data: TransferProductOption[] = items.map((i) => ({
      inventoryItemId: i.id,
      productId: i.productId,
      sku: i.product.sku,
      productName: i.product.name,
      quantity: i.quantity,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("listTransferableProducts failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load products.";
    return { data: null, error: message };
  }
}

// --- Mutations ---

export async function createWarehouse(
  input: CreateWarehouseInput
): Promise<ActionResult<{ id: string; name: string; code: string }>> {
  try {
    const parsed = createWarehouseSchema.parse(input);

    const code = await generateUniqueCode(parsed.name);

    const warehouse = await prisma.warehouse.create({
      data: {
        name: parsed.name,
        code,
        address: parsed.location ?? null,
        capacity: parsed.capacity != null && parsed.capacity > 0 ? parsed.capacity : null,
      },
    });

    revalidatePath("/merchant/warehouse");

    return {
      data: { id: warehouse.id, name: warehouse.name, code: warehouse.code },
      error: null,
    };
  } catch (error: unknown) {
    console.error("createWarehouse failed:", error);
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0]?.message ?? "Invalid input." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { data: null, error: `Database error: ${error.code}` };
    }
    const message =
      error instanceof Error ? error.message : "Failed to create warehouse.";
    return { data: null, error: message };
  }
}

export async function transferStock(
  input: TransferStockInput
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const parsed = transferStockSchema.parse(input);

    if (parsed.fromWarehouseId === parsed.toWarehouseId) {
      return {
        data: null,
        error: "Source and destination warehouses must be different.",
      };
    }

    // โหลด warehouse ทั้งสองฝั่ง
    const [fromWh, toWh] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: parsed.fromWarehouseId } }),
      prisma.warehouse.findUnique({ where: { id: parsed.toWarehouseId } }),
    ]);
    if (!fromWh) return { data: null, error: "Source warehouse not found." };
    if (!toWh) return { data: null, error: "Destination warehouse not found." };
    if (!toWh.isActive) {
      return { data: null, error: "Destination warehouse is inactive." };
    }

    await prisma.$transaction(async (tx) => {
      // หา InventoryItem ของ product ใน warehouse ต้นทาง
      const source = await tx.inventoryItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: parsed.productId,
            warehouseId: parsed.fromWarehouseId,
          },
        },
      });
      if (!source) {
        throw new Error("Product is not stored in the selected source warehouse.");
      }
      if (source.quantity < parsed.quantity) {
        throw new Error(
          `Insufficient stock. Available: ${source.quantity}, requested: ${parsed.quantity}.`
        );
      }

      // ลดสต็อกที่ต้นทาง (รองรับ partial transfer)
      const updatedSource = await tx.inventoryItem.update({
        where: { id: source.id },
        data: { quantity: { decrement: parsed.quantity } },
      });

      // upsert สต็อกที่ปลายทาง (ใช้ composite unique productId+warehouseId)
      const destination = await tx.inventoryItem.upsert({
        where: {
          productId_warehouseId: {
            productId: parsed.productId,
            warehouseId: parsed.toWarehouseId,
          },
        },
        create: {
          productId: parsed.productId,
          warehouseId: parsed.toWarehouseId,
          location: toWh.code,
          quantity: parsed.quantity,
          lowStockThreshold: source.lowStockThreshold,
        },
        update: {
          quantity: { increment: parsed.quantity },
        },
      });

      // log 2 transaction: OUT (source) + IN (destination)
      await tx.inventoryTransaction.createMany({
        data: [
          {
            inventoryItemId: updatedSource.id,
            type: InventoryTransactionType.ADJUSTMENT,
            quantityDelta: -parsed.quantity,
            note: `Transfer OUT to ${toWh.code} (${toWh.name})`,
          },
          {
            inventoryItemId: destination.id,
            type: InventoryTransactionType.ADJUSTMENT,
            quantityDelta: parsed.quantity,
            note: `Transfer IN from ${fromWh.code} (${fromWh.name})`,
          },
        ],
      });
    });

    revalidatePath("/merchant/warehouse");
    revalidatePath(`/merchant/warehouse/${parsed.fromWarehouseId}`);
    revalidatePath(`/merchant/warehouse/${parsed.toWarehouseId}`);

    return { data: { success: true }, error: null };
  } catch (error: unknown) {
    console.error("transferStock failed:", error);
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0]?.message ?? "Invalid input." };
    }
    const message =
      error instanceof Error ? error.message : "Failed to transfer stock.";
    return { data: null, error: message };
  }
}
