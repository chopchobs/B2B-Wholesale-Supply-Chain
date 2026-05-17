"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityInput } from "@/components/storefront/QuantityInput";
import { PricingTierTable } from "@/components/storefront/PricingTierTable";
import {
  calculateUnitPrice,
  useCartStore,
  type CartProduct,
} from "@/store/useCartStore";

interface ProductDetailProps {
  product: CartProduct;
}

export function ProductDetail({ product }: ProductDetailProps): React.ReactElement {
  const [quantity, setQuantity] = React.useState<number>(product.moq);
  const [justAdded, setJustAdded] = React.useState<boolean>(false);
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  const isOutOfStock = product.stock <= 0;

  const unitPrice = React.useMemo(
    () => calculateUnitPrice(product.basePrice, quantity, product.priceTiers),
    [product.basePrice, quantity, product.priceTiers],
  );
  const totalPrice = unitPrice * quantity;
  const hasDiscount = unitPrice < product.basePrice;

  function handleAddToCart(): void {
    if (quantity < product.moq || isOutOfStock) return;
    addItem(product, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2200);
  }

  function handleBuyNow(): void {
    if (quantity < product.moq || isOutOfStock) return;
    addItem(product, quantity);
    router.push("/cart");
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Visual section */}
      <div className="space-y-4">
        <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-[#E8E0D5] bg-gradient-to-br from-[#F5F0E8] via-white to-[#D4A574]/30 lg:h-[28rem]">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/70 text-[#CC785C] shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-16 w-16"
            >
              <path d="m7.5 4.27 9 5.15" />
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-mono uppercase text-[#736B66]">
            SKU {product.sku}
          </span>
        </div>

        {/* Mini info cards */}
        <div className="grid grid-cols-3 gap-3">
          <InfoCard label="MOQ" value={`${product.moq} units`} />
          <InfoCard
            label="Stock"
            value={isOutOfStock ? "Unavailable" : `${product.stock} units`}
            tone={isOutOfStock ? "muted" : "accent"}
          />
          <InfoCard
            label="Category"
            value={product.categoryName ?? "Uncategorized"}
          />
        </div>
      </div>

      {/* Info / actions */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#2D2825] md:text-4xl">
            {product.name}
          </h1>
          {product.description ? (
            <p className="mt-3 text-[#736B66]">{product.description}</p>
          ) : null}
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-[#2D2825]">
            ฿{unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          {hasDiscount ? (
            <>
              <span className="text-lg text-[#736B66] line-through">
                ฿{product.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="rounded-full bg-[#CC785C]/10 px-2.5 py-1 text-xs font-semibold text-[#CC785C]">
                Volume price
              </span>
            </>
          ) : null}
          <span className="text-sm text-[#736B66]">/ unit</span>
        </div>

        {/* Pricing tier table */}
        {product.priceTiers && product.priceTiers.length > 0 ? (
          <PricingTierTable
            basePrice={product.basePrice}
            tiers={product.priceTiers}
            currentQuantity={quantity}
          />
        ) : null}

        {/* Quantity + actions */}
        <div className="rounded-2xl border border-[#E8E0D5] bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#736B66]">
                Quantity (min {product.moq})
              </label>
              <QuantityInput
                value={quantity}
                onChange={setQuantity}
                min={product.moq}
                max={product.stock > 0 ? product.stock : undefined}
                disabled={isOutOfStock}
              />
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-[#736B66]">
                Estimated total
              </p>
              <p className="text-2xl font-bold text-[#2D2825]">
                ฿{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || quantity < product.moq}
              className="flex-1 bg-[#CC785C] text-white hover:bg-[#B86548] disabled:bg-[#E8E0D5] disabled:text-[#736B66]"
            >
              {justAdded ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Added to cart
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleBuyNow}
              disabled={isOutOfStock || quantity < product.moq}
              className="flex-1 border-[#E8E0D5] bg-white text-[#2D2825] hover:border-[#CC785C]/40 hover:text-[#CC785C]"
            >
              Buy Now
            </Button>
          </div>

          <p className="mt-3 text-xs text-[#736B66]">
            Volume tier savings are applied automatically based on quantity.
          </p>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center text-sm font-medium text-[#CC785C] hover:text-[#B86548]"
        >
          ← Back to all products
        </Link>
      </div>
    </div>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
  tone?: "default" | "accent" | "muted";
}

function InfoCard({
  label,
  value,
  tone = "default",
}: InfoCardProps): React.ReactElement {
  const valueColor =
    tone === "accent"
      ? "text-[#CC785C]"
      : tone === "muted"
        ? "text-[#736B66]"
        : "text-[#2D2825]";
  return (
    <div className="rounded-xl border border-[#E8E0D5] bg-white p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#736B66]">
        {label}
      </p>
      <p className={`mt-1 truncate text-sm font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}
