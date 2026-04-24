import React from "react";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { CartProduct } from "@/store/useCartStore";

export const dynamic = "force-dynamic";

export default async function StorefrontProductsPage() {
  // Fetch only active products
  let dbProducts: any[] = [];
  try {
    dbProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        priceTiers: {
          where: { isActive: true },
          orderBy: { minQuantity: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Database connection error:", error);
    // Fallback to empty array if DB fails (e.g. invalid credentials)
  }

  // Safely serialize Prisma Decimal to standard numbers for the Client Component
  const serializedProducts: CartProduct[] = dbProducts.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    basePrice: Number(p.basePrice),
    moq: p.moq,
    stock: p.stock,
    priceTiers: p.priceTiers ? p.priceTiers.map((t: any) => ({
      id: t.id,
      minQuantity: t.minQuantity,
      unitPrice: Number(t.unitPrice),
    })) : [],
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">B2B Wholesale Catalog</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Browse our premium selection of supplies. Bulk volume discounts are applied automatically to your quote.
          </p>
        </div>
      </div>

      {/* Render Client Component Grid */}
      <ProductGrid products={serializedProducts} />
    </div>
  );
}
