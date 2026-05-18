import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiError,
  apiSuccess,
  handleApiError,
  requireMerchant,
} from "@/lib/api/helpers";
import { UpdateCustomerSchema } from "@/lib/api/schemas";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

// GET /api/customers/[id] — MERCHANT only, include contacts + order history
export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requireMerchant();
    const { id } = await ctx.params;

    const customer = await prisma.customerProfile.findUnique({
      where: { id },
      include: {
        contacts: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            orders: {
              orderBy: { createdAt: "desc" },
              take: 20,
              include: { items: true },
            },
          },
        },
      },
    });

    if (!customer) return apiError("Customer not found", 404);
    return apiSuccess(customer);
  } catch (err) {
    return handleApiError(err);
  }
}

// PUT /api/customers/[id] — MERCHANT only, partial update
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    await requireMerchant();
    const { id } = await ctx.params;

    const body = await req.json();
    const parsed = UpdateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid body", 422);
    }

    const existing = await prisma.customerProfile.findUnique({ where: { id } });
    if (!existing) return apiError("Customer not found", 404);

    // ห้ามแก้ userId ผ่าน PUT (กัน relink)
    const { userId: _ignored, ...patch } = parsed.data;
    void _ignored;

    const updated = await prisma.customerProfile.update({
      where: { id },
      data: patch,
      include: {
        contacts: true,
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    return apiSuccess(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
