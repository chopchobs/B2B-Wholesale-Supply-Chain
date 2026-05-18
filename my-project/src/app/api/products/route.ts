import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiError,
  apiSuccess,
  handleApiError,
  parsePagination,
  requireMerchant,
} from "@/lib/api/helpers";
import { CreateProductSchema } from "@/lib/api/schemas";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// GET /api/products — public
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isActiveParam = searchParams.get("isActive");

    const where: Prisma.ProductWhereInput = {};

    if (isActiveParam !== null) {
      where.isActive = isActiveParam === "true";
    }
    if (category) {
      where.categoryId = category;
    }
    if (search) {
      // ค้นหาตามชื่อหรือ SKU
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          priceTiers: true,
          category: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return apiSuccess({ items, total, page, limit });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/products — MERCHANT only
export async function POST(req: NextRequest) {
  try {
    await requireMerchant();

    const body = await req.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid body", 422);
    }

    const { name, sku, description, basePrice, moq, shopId, categoryId, isActive } =
      parsed.data;

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description: description ?? null,
        basePrice,
        moq: moq ?? 1,
        shopId,
        categoryId: categoryId ?? null,
        isActive: isActive ?? true,
      },
      include: { priceTiers: true, category: true },
    });

    return apiSuccess(product, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
