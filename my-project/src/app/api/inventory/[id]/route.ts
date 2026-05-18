import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiError,
  apiSuccess,
  handleApiError,
  requireMerchant,
} from "@/lib/api/helpers";
import { UpdateInventorySchema } from "@/lib/api/schemas";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// GET /api/inventory/[id] — MERCHANT only
export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requireMerchant();
    const { id } = await ctx.params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { product: true, warehouse: true, transactions: true },
    });

    if (!item) return apiError("Inventory item not found", 404);
    return apiSuccess(item);
  } catch (err) {
    return handleApiError(err);
  }
}

// PUT /api/inventory/[id] — MERCHANT only
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    await requireMerchant();
    const { id } = await ctx.params;

    const body = await req.json();
    const parsed = UpdateInventorySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid body", 422);
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) return apiError("Inventory item not found", 404);

    const { quantity, lowStockThreshold, note } = parsed.data;

    // ถ้า quantity เปลี่ยน → สร้าง InventoryTransaction (ADJUSTMENT)
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.inventoryItem.update({
        where: { id },
        data: {
          ...(quantity !== undefined ? { quantity } : {}),
          ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
        },
        include: { product: true, warehouse: true },
      });

      if (quantity !== undefined && quantity !== existing.quantity) {
        const delta = quantity - existing.quantity;
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: id,
            type: "ADJUSTMENT",
            quantityDelta: delta,
            note: note ?? `Adjusted via API (${delta >= 0 ? "+" : ""}${delta})`,
          },
        });
      }

      return next;
    });

    return apiSuccess(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
