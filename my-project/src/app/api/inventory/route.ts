import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  handleApiError,
  requireMerchant,
} from "@/lib/api/helpers";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// GET /api/inventory — MERCHANT only
export async function GET(req: NextRequest) {
  try {
    await requireMerchant();
    const { searchParams } = new URL(req.url);

    const warehouseId = searchParams.get("warehouseId");
    const productId = searchParams.get("productId");
    const lowStock = searchParams.get("lowStock") === "true";

    const where: Prisma.InventoryItemWhereInput = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (productId) where.productId = productId;

    // lowStock filter: quantity <= lowStockThreshold ใช้ raw expression ผ่าน Prisma ไม่ได้ตรงๆ
    // จึงใช้วิธี fetch แล้ว filter ใน app layer หลังจาก query หลัก
    const [rawItems, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: {
          product: true,
          warehouse: true,
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    const items = lowStock
      ? rawItems.filter((i) => i.quantity <= i.lowStockThreshold)
      : rawItems;

    return apiSuccess({
      items,
      total: lowStock ? items.length : total,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
