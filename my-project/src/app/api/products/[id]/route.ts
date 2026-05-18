import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiError,
  apiSuccess,
  handleApiError,
  requireMerchant,
} from "@/lib/api/helpers";
import { UpdateProductSchema } from "@/lib/api/schemas";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// GET /api/products/[id] — public
export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        priceTiers: true,
        category: true,
        inventoryItems: true,
      },
    });

    if (!product) return apiError("Product not found", 404);
    return apiSuccess(product);
  } catch (err) {
    return handleApiError(err);
  }
}

// PUT /api/products/[id] — MERCHANT only, partial update
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    await requireMerchant();
    const { id } = await ctx.params;

    const body = await req.json();
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid body", 422);
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return apiError("Product not found", 404);

    const updated = await prisma.product.update({
      where: { id },
      data: parsed.data,
      include: { priceTiers: true, category: true },
    });

    return apiSuccess(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/products/[id] — soft delete
export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requireMerchant();
    const { id } = await ctx.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return apiError("Product not found", 404);

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return apiSuccess({ id: updated.id, isActive: updated.isActive });
  } catch (err) {
    return handleApiError(err);
  }
}
