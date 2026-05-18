import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiError,
  apiSuccess,
  handleApiError,
  parsePagination,
  requireMerchant,
} from "@/lib/api/helpers";
import {
  CreateCustomerSchema,
  CustomerTierEnum,
} from "@/lib/api/schemas";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// GET /api/customers — MERCHANT only
export async function GET(req: NextRequest) {
  try {
    await requireMerchant();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const search = searchParams.get("search");
    const tier = searchParams.get("tier");

    const where: Prisma.CustomerProfileWhereInput = {};

    if (tier) {
      const tierParsed = CustomerTierEnum.safeParse(tier);
      if (!tierParsed.success) return apiError("Invalid tier filter", 400);
      where.accountTier = tierParsed.data;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { taxId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          contacts: true,
          user: { select: { id: true, email: true, name: true, role: true } },
        },
      }),
      prisma.customerProfile.count({ where }),
    ]);

    return apiSuccess({ items, total, page, limit });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/customers — MERCHANT only
export async function POST(req: NextRequest) {
  try {
    await requireMerchant();
    const body = await req.json();
    const parsed = CreateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid body", 422);
    }

    const {
      userId,
      companyName,
      taxId,
      creditLimit,
      accountTier,
      status,
      billingAddress,
      shippingAddress,
      notes,
    } = parsed.data;

    // ตรวจสอบว่ายังไม่มี profile สำหรับ user นี้
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) return apiError("User not found", 404);

    const existing = await prisma.customerProfile.findUnique({ where: { userId } });
    if (existing) return apiError("Customer profile already exists for user", 400);

    const created = await prisma.customerProfile.create({
      data: {
        userId,
        companyName,
        taxId: taxId ?? null,
        creditLimit: creditLimit ?? 0,
        accountTier: accountTier ?? "BRONZE",
        status: status ?? "PENDING",
        billingAddress: billingAddress ?? null,
        shippingAddress: shippingAddress ?? null,
        notes: notes ?? null,
      },
      include: {
        contacts: true,
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    return apiSuccess(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
