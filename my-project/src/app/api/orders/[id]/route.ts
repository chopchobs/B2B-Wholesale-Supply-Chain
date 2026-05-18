import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiError,
  apiSuccess,
  handleApiError,
  requireAuth,
  requireMerchant,
} from "@/lib/api/helpers";
import { UpdateOrderSchema } from "@/lib/api/schemas";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// GET /api/orders/[id]
export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { userId, role } = await requireAuth();
    const { id } = await ctx.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    if (!order) return apiError("Order not found", 404);

    // USER ดึงได้แค่ของตัวเอง
    if (role !== "MERCHANT" && role !== "ADMIN" && order.userId !== userId) {
      return apiError("Forbidden", 403);
    }

    return apiSuccess(order);
  } catch (err) {
    return handleApiError(err);
  }
}

// PUT /api/orders/[id] — MERCHANT only (แก้ notes/metadata เท่านั้น)
// NOTE: schema ไม่มี field notes ใน Order — เก็บเป็น no-op สำหรับ field ที่ไม่รองรับ
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    await requireMerchant();
    const { id } = await ctx.params;

    const body = await req.json();
    const parsed = UpdateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid body", 422);
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return apiError("Order not found", 404);

    // ตอนนี้ Order ยังไม่มี field notes → trigger updatedAt อย่างเดียว
    const updated = await prisma.order.update({
      where: { id },
      data: { updatedAt: new Date() },
      include: { items: true },
    });

    return apiSuccess(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
