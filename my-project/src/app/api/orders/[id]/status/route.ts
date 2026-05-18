import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiError,
  apiSuccess,
  handleApiError,
  requireMerchant,
} from "@/lib/api/helpers";
import { UpdateOrderStatusSchema } from "@/lib/api/schemas";
import type { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// Allowed transition map ตาม lifecycle ปกติของ Order
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [], // terminal
  CANCELLED: [], // terminal
};

// PUT /api/orders/[id]/status — MERCHANT only
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    await requireMerchant();
    const { id } = await ctx.params;

    const body = await req.json();
    const parsed = UpdateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid body", 422);
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!order) return apiError("Order not found", 404);

    const nextStatus = parsed.data.status as OrderStatus;
    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];

    if (order.status === nextStatus) {
      // ไม่เปลี่ยน → return ตามเดิม
      return apiSuccess({ id: order.id, status: order.status });
    }

    if (!allowed.includes(nextStatus)) {
      return apiError(
        `Invalid status transition: ${order.status} → ${nextStatus}`,
        400
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: nextStatus },
      select: { id: true, status: true },
    });

    return apiSuccess(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
