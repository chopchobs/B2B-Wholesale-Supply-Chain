import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiError,
  apiSuccess,
  handleApiError,
  parsePagination,
  requireAuth,
} from "@/lib/api/helpers";
import { CreateOrderSchema, OrderStatusEnum } from "@/lib/api/schemas";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// GET /api/orders — authenticated (USER เห็นแค่ของตัวเอง, MERCHANT/ADMIN เห็นทั้งหมด)
export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const statusParam = searchParams.get("status");
    const userIdParam = searchParams.get("userId");

    const where: Prisma.OrderWhereInput = {};

    // USER ทั่วไปบังคับเห็นได้แค่ของตัวเอง
    if (role !== "MERCHANT" && role !== "ADMIN") {
      where.userId = userId;
    } else if (userIdParam) {
      // MERCHANT/ADMIN filter ตาม userId ได้
      where.userId = userIdParam;
    }

    if (statusParam) {
      const statusParsed = OrderStatusEnum.safeParse(statusParam);
      if (!statusParsed.success) return apiError("Invalid status filter", 400);
      where.status = statusParsed.data;
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, email: true, name: true, role: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return apiSuccess({ items, total, page, limit });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/orders — authenticated
export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await requireAuth();
    const body = await req.json();
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid body", 422);
    }

    const { items } = parsed.data;

    // ดึง product ทั้งหมดที่อยู่ใน order พร้อม priceTiers
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { priceTiers: { where: { isActive: true } } },
    });

    if (products.length !== productIds.length) {
      return apiError("One or more products not found", 404);
    }

    // คำนวณราคา: เลือก best matching tier ตาม role + minQuantity, fallback basePrice
    const computedItems = items.map((it) => {
      const product = products.find((p) => p.id === it.productId);
      if (!product) throw new Error(`Product ${it.productId} not found`);

      const eligibleTiers = product.priceTiers
        .filter((t) => t.targetRole === role && it.quantity >= t.minQuantity)
        .sort((a, b) => b.minQuantity - a.minQuantity);

      const unitPriceDecimal =
        eligibleTiers[0]?.unitPrice ?? product.basePrice;
      const unitPrice = Number(unitPriceDecimal);
      const subTotal = unitPrice * it.quantity;

      return {
        productId: it.productId,
        quantity: it.quantity,
        unitPrice,
        subTotal,
      };
    });

    const totalAmount = computedItems.reduce((acc, i) => acc + i.subTotal, 0);

    // ใช้ transaction สร้าง Order + OrderItems พร้อมกัน
    const order = await prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          userId,
          totalAmount,
          items: {
            create: computedItems.map((c) => ({
              productId: c.productId,
              quantity: c.quantity,
              unitPrice: c.unitPrice,
              subTotal: c.subTotal,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, email: true, name: true } },
        },
      });
    });

    return apiSuccess(order, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
