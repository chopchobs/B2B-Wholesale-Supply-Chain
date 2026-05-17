import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductDetail } from "@/components/storefront/ProductDetail";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { CartProduct } from "@/store/useCartStore";

export const dynamic = "force-dynamic";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage(
  props: ProductDetailPageProps,
): Promise<React.ReactElement> {
  const { id } = await props.params;

  const product = await prisma.product.findUnique({
    where: { id, isActive: true },
    include: {
      priceTiers: { where: { isActive: true } },
      category: true,
    },
  });

  if (!product) {
    notFound();
  }

  // ดึงสินค้าที่อยู่ในหมวดเดียวกัน (max 4 ตัวที่ไม่ใช่ตัวเอง)
  const relatedDb = product.categoryId
    ? await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          isActive: true,
          NOT: { id: product.id },
        },
        include: {
          priceTiers: { where: { isActive: true } },
          category: true,
        },
        take: 4,
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Helper สำหรับ serialize ข้อมูลให้ client component
  function serialize(p: (typeof relatedDb)[number]): CartProduct {
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      basePrice: Number(p.basePrice),
      moq: p.moq,
      stock: p.stock,
      description: p.description ?? null,
      categoryId: p.categoryId ?? null,
      categoryName: p.category?.name ?? null,
      priceTiers: p.priceTiers.map((t) => ({
        id: t.id,
        minQuantity: t.minQuantity,
        unitPrice: Number(t.unitPrice),
      })),
    };
  }

  const serializedProduct = serialize(product);
  const serializedRelated = relatedDb.map(serialize);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:py-10">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1.5 text-sm text-[#736B66]"
      >
        <Link href="/products" className="hover:text-[#CC785C]">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-[#CC785C]">
          Products
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-[#2D2825]">{product.name}</span>
      </nav>

      <ProductDetail product={serializedProduct} />

      {/* Related products */}
      {serializedRelated.length > 0 ? (
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#2D2825]">
                Related Products
              </h2>
              <p className="mt-1 text-sm text-[#736B66]">
                More items from{" "}
                <span className="font-medium text-[#2D2825]">
                  {product.category?.name ?? "this category"}
                </span>
              </p>
            </div>
            <Link
              href="/products"
              className="hidden text-sm font-medium text-[#CC785C] hover:text-[#B86548] sm:inline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {serializedRelated.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
