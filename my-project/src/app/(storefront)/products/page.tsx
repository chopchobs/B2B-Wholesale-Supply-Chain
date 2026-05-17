import * as React from "react";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  ProductsBrowser,
  type StorefrontCategory,
} from "@/components/storefront/ProductsBrowser";
import type { CartProduct } from "@/store/useCartStore";

export const dynamic = "force-dynamic";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { priceTiers: true; category: true };
}>;

export default async function StorefrontProductsPage(): Promise<React.ReactElement> {
  // ดึงข้อมูลสินค้าและหมวดหมู่จาก DB
  let dbProducts: ProductWithRelations[] = [];
  let dbCategories: { id: string; name: string }[] = [];

  try {
    [dbProducts, dbCategories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          priceTiers: {
            where: { isActive: true },
            orderBy: { minQuantity: "desc" },
          },
          category: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
  } catch (error) {
    // ถ้า DB ล่ม fallback เป็น empty list
    console.error("Database connection error:", error);
  }

  // Serialize Prisma Decimal เป็น number ให้ client component ใช้ได้
  const serializedProducts: CartProduct[] = dbProducts.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    basePrice: Number(p.basePrice),
    moq: p.moq,
    stock: p.stock,
    description: p.description ?? null,
    categoryId: p.categoryId ?? null,
    categoryName: p.category?.name ?? null,
    priceTiers: p.priceTiers
      ? p.priceTiers.map((t) => ({
          id: t.id,
          minQuantity: t.minQuantity,
          unitPrice: Number(t.unitPrice),
        }))
      : [],
  }));

  // เก็บ map ของ createdAt เพื่อ sort "newest" ฝั่ง client โดยไม่ส่ง Date object
  const createdAtMap: Record<string, number> = {};
  for (const p of dbProducts) {
    createdAtMap[p.id] = new Date(p.createdAt).getTime();
  }

  const categories: StorefrontCategory[] = dbCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] md:text-4xl">
          B2B Wholesale Catalog
        </h1>
        <p className="mt-2 max-w-2xl text-[#736B66]">
          Browse our premium selection of supplies. Bulk volume discounts are applied
          automatically to your quote.
        </p>
      </div>

      <ProductsBrowser
        products={serializedProducts}
        categories={categories}
        createdAtMap={createdAtMap}
      />
    </div>
  );
}
