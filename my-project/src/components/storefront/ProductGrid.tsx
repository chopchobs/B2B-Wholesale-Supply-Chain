"use client";

import React from "react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CartProduct } from "@/store/useCartStore";

interface ProductGridProps {
  products: CartProduct[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">No products available</h3>
        <p className="text-muted-foreground mt-2">Check back later for our new catalog additions.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
