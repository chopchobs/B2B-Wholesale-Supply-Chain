"use client";

import * as React from "react";
import Link from "next/link";
import { Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityInput } from "@/components/storefront/QuantityInput";
import {
  useCartStore,
  calculateUnitPrice,
  type CartProduct,
} from "@/store/useCartStore";

interface ProductCardProps {
  product: CartProduct;
}

export function ProductCard({ product }: ProductCardProps): React.ReactElement {
  const [quantity, setQuantity] = React.useState<number>(product.moq);
  const addItem = useCartStore((state) => state.addItem);

  // คำนวณราคา/หน่วยตามปริมาณปัจจุบัน (real-time tier matching)
  const currentUnitPrice = React.useMemo(() => {
    return calculateUnitPrice(product.basePrice, quantity, product.priceTiers);
  }, [product.basePrice, quantity, product.priceTiers]);

  const totalPrice = currentUnitPrice * quantity;
  const isOutOfStock = product.stock <= 0;
  const hasDiscount = currentUnitPrice < product.basePrice;

  function handleAdd(): void {
    if (quantity >= product.moq && !isOutOfStock) {
      addItem(product, quantity);
    }
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8E0D5] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Image placeholder */}
      <Link
        href={`/products/${product.id}`}
        className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-[#F5F0E8] to-[#D4A574]/30"
        aria-label={`View ${product.name}`}
      >
        <Package className="h-14 w-14 text-[#CC785C]/40 transition-transform duration-200 group-hover:scale-110" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide text-[#736B66]">
          {product.sku}
        </span>
        {isOutOfStock ? (
          <span className="absolute right-3 top-3 rounded-full bg-[#2D2825] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            Out of stock
          </span>
        ) : (
          <span className="absolute right-3 top-3 rounded-full bg-[#CC785C] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            MOQ {product.moq}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link href={`/products/${product.id}`}>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[#2D2825] transition-colors hover:text-[#CC785C]">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#2D2825]">
            ฿{currentUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          {hasDiscount ? (
            <span className="text-sm text-[#736B66] line-through">
              ฿{product.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          ) : null}
          <span className="text-xs text-[#736B66]">/ unit</span>
        </div>

        {/* Tier preview */}
        {product.priceTiers && product.priceTiers.length > 0 ? (
          <div className="rounded-lg border border-[#E8E0D5] bg-[#F5F0E8]/50 p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#736B66]">
              Volume Discounts
            </p>
            <ul className="space-y-0.5 text-xs">
              {[...product.priceTiers]
                .sort((a, b) => a.minQuantity - b.minQuantity)
                .slice(0, 3)
                .map((tier) => (
                  <li
                    key={tier.id}
                    className="flex justify-between text-[#736B66]"
                  >
                    <span>{tier.minQuantity}+ units</span>
                    <span className="font-medium text-[#CC785C]">
                      ฿{tier.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {/* Quantity + total */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[#736B66]">
              Quantity
            </p>
            <QuantityInput
              value={quantity}
              onChange={setQuantity}
              min={product.moq}
              max={product.stock > 0 ? product.stock : undefined}
              disabled={isOutOfStock}
            />
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-[#736B66]">
              Subtotal
            </p>
            <p className="text-lg font-bold text-[#2D2825]">
              ฿{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleAdd}
          disabled={isOutOfStock || quantity < product.moq}
          className="w-full bg-[#CC785C] text-white hover:bg-[#B86548] disabled:bg-[#E8E0D5] disabled:text-[#736B66]"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isOutOfStock ? "Out of stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
