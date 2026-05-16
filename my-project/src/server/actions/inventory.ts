"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  InventoryTransactionType,
  Prisma,
} from "@prisma/client";
import { createNotification } from "@/server/actions/notifications";

// --- Types ---

export type InventoryStatus = "OK" | "LOW" | "OUT";

export interface InventoryItemWithProduct {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  lowStockThreshold: number;
  location: string;
  status: InventoryStatus;
  updatedAt: Date;
}

export interface InventoryTransactionRow {
  id: string;
  type: InventoryTransactionType;
  quantityDelta: number;
  note: string | null;
  createdAt: Date;
}

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

// --- Helpers ---

// คำนวณสถานะสต็อกตาม threshold
function resolveStatus(qty: number, threshold: number): InventoryStatus {
  if (qty <= 0) return "OUT";
  if (qty <= threshold) return "LOW";
  return "OK";
}

// ส่ง notification ไปยัง merchant ทุกคนเมื่อสต็อกต่ำ/หมด
async function notifyMerchantsLowStock(
  inventoryItemId: string,
  productId: string,
  quantity: number,
  threshold: number
): Promise<void> {
  try {
    if (quantity > threshold) return; // สต็อกยังโอเค ไม่ต้องเตือน

    const [product, merchants] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, sku: true },
      }),
      prisma.user.findMany({
        where: { role: { in: ["MERCHANT", "ADMIN"] }, isActive: true },
        select: { id: true },
      }),
    ]);

    if (!product || merchants.length === 0) return;

    const isOut = quantity <= 0;
    const type = isOut ? "OUT_OF_STOCK" : "LOW_STOCK";
    const title = isOut
      ? `Out of stock: ${product.name}`
      : `Low stock alert: ${product.name}`;
    const message = isOut
      ? `${product.name} (SKU: ${product.sku}) is out of stock. Restock immediately.`
      : `${product.name} (SKU: ${product.sku}) is below threshold (${quantity}/${threshold}).`;

    await Promise.all(
      merchants.map((m) =>
        createNotification({
          userId: m.id,
          type,
          title,
          message,
          link: `/merchant/inventory`,
          metadata: { inventoryItemId, productId, quantity, threshold },
        })
      )
    );
  } catch (err: unknown) {
    // ห้าม block flow หลัก ถ้าแจ้งเตือนล้มเหลว
    console.error("notifyMerchantsLowStock failed:", err);
  }
}

// --- Zod Schemas ---

const restockSchema = z.object({
  id: z.string().min(1, "Inventory item id is required."),
  quantity: z.number().int().positive("Quantity must be positive."),
  note: z.string().max(500).optional().nullable(),
});

const adjustSchema = z.object({
  id: z.string().min(1, "Inventory item id is required."),
  // ปรับมือเป็นบวกหรือลบก็ได้ แต่ห้ามเป็น 0
  quantity: z
    .number()
    .int()
    .refine((v) => v !== 0, { message: "Quantity must not be zero." }),
  note: z.string().max(500).optional().nullable(),
});

export type RestockInput = z.infer<typeof restockSchema>;
export type AdjustInput = z.infer<typeof adjustSchema>;

// --- Queries ---

export async function getInventoryItems(): Promise<
  ActionResult<InventoryItemWithProduct[]>
> {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        product: {
          select: { sku: true, name: true },
        },
      },
    });

    const data: InventoryItemWithProduct[] = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.product.sku,
      productName: item.product.name,
      quantity: item.quantity,
      lowStockThreshold: item.lowStockThreshold,
      location: item.location,
      status: resolveStatus(item.quantity, item.lowStockThreshold),
      updatedAt: item.updatedAt,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getInventoryItems failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load inventory.";
    return { data: null, error: message };
  }
}

export async function getLowStockItems(): Promise<
  ActionResult<InventoryItemWithProduct[]>
> {
  try {
    // ดึงทั้งหมดก่อน แล้วกรองด้วย threshold ในระดับ JS เพื่อรองรับ threshold แบบต่อรายการ
    const items = await prisma.inventoryItem.findMany({
      include: { product: { select: { sku: true, name: true } } },
    });

    const data: InventoryItemWithProduct[] = items
      .filter((i) => i.quantity <= i.lowStockThreshold)
      .map((item) => ({
        id: item.id,
        productId: item.productId,
        sku: item.product.sku,
        productName: item.product.name,
        quantity: item.quantity,
        lowStockThreshold: item.lowStockThreshold,
        location: item.location,
        status: resolveStatus(item.quantity, item.lowStockThreshold),
        updatedAt: item.updatedAt,
      }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getLowStockItems failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load low stock.";
    return { data: null, error: message };
  }
}

export async function getInventoryTransactions(
  itemId: string
): Promise<ActionResult<InventoryTransactionRow[]>> {
  try {
    if (!itemId) {
      return { data: null, error: "Item id is required." };
    }
    const txs = await prisma.inventoryTransaction.findMany({
      where: { inventoryItemId: itemId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const data: InventoryTransactionRow[] = txs.map((t) => ({
      id: t.id,
      type: t.type,
      quantityDelta: t.quantityDelta,
      note: t.note,
      createdAt: t.createdAt,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getInventoryTransactions failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load transactions.";
    return { data: null, error: message };
  }
}

// --- Mutations ---

export async function restockItem(
  input: RestockInput
): Promise<ActionResult<{ id: string; quantity: number }>> {
  try {
    const parsed = restockSchema.parse(input);

    // ใช้ transaction รวม update stock + log transaction ให้ atomic
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.update({
        where: { id: parsed.id },
        data: { quantity: { increment: parsed.quantity } },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          type: InventoryTransactionType.RESTOCK,
          quantityDelta: parsed.quantity,
          note: parsed.note ?? null,
        },
      });

      // sync ค่าใน Product.stock ให้สอดคล้องด้วย (ของเดิมยังมี field stock)
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: item.quantity },
      });

      return item;
    });

    revalidatePath("/merchant/inventory");
    revalidatePath("/merchant");

    // เช็คสต็อกหลัง restock — บางกรณี restock น้อยอาจยังต่ำกว่า threshold
    await notifyMerchantsLowStock(
      result.id,
      result.productId,
      result.quantity,
      result.lowStockThreshold
    );

    return {
      data: { id: result.id, quantity: result.quantity },
      error: null,
    };
  } catch (error: unknown) {
    console.error("restockItem failed:", error);
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0]?.message ?? "Invalid input." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { data: null, error: `Database error: ${error.code}` };
    }
    const message =
      error instanceof Error ? error.message : "Failed to restock.";
    return { data: null, error: message };
  }
}

export async function adjustInventory(
  input: AdjustInput
): Promise<ActionResult<{ id: string; quantity: number }>> {
  try {
    const parsed = adjustSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      // อ่านปริมาณปัจจุบันก่อน เพื่อกันไม่ให้ลบจนติดลบ
      const current = await tx.inventoryItem.findUnique({
        where: { id: parsed.id },
        select: { quantity: true },
      });
      if (!current) {
        throw new Error("Inventory item not found.");
      }
      const next = current.quantity + parsed.quantity;
      if (next < 0) {
        throw new Error("Adjustment would make stock negative.");
      }

      const item = await tx.inventoryItem.update({
        where: { id: parsed.id },
        data: { quantity: next },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          type: InventoryTransactionType.ADJUSTMENT,
          quantityDelta: parsed.quantity,
          note: parsed.note ?? null,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: item.quantity },
      });

      return item;
    });

    revalidatePath("/merchant/inventory");
    revalidatePath("/merchant");

    await notifyMerchantsLowStock(
      result.id,
      result.productId,
      result.quantity,
      result.lowStockThreshold
    );

    return {
      data: { id: result.id, quantity: result.quantity },
      error: null,
    };
  } catch (error: unknown) {
    console.error("adjustInventory failed:", error);
    if (error instanceof z.ZodError) {
      return { data: null, error: error.issues[0]?.message ?? "Invalid input." };
    }
    const message =
      error instanceof Error ? error.message : "Failed to adjust inventory.";
    return { data: null, error: message };
  }
}

// สรุปข้อมูลสำหรับ Dashboard overview card
export async function getInventorySummary(): Promise<
  ActionResult<{ totalSkus: number; lowStockCount: number; outOfStockCount: number }>
> {
  try {
    const items = await prisma.inventoryItem.findMany({
      select: { quantity: true, lowStockThreshold: true },
    });

    let lowStockCount = 0;
    let outOfStockCount = 0;
    for (const i of items) {
      if (i.quantity <= 0) outOfStockCount += 1;
      else if (i.quantity <= i.lowStockThreshold) lowStockCount += 1;
    }

    return {
      data: {
        totalSkus: items.length,
        lowStockCount,
        outOfStockCount,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("getInventorySummary failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load summary.";
    return { data: null, error: message };
  }
}
