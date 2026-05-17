"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityInput } from "@/components/storefront/QuantityInput";
import { EmptyState } from "@/components/storefront/EmptyState";
import { useCartStore } from "@/store/useCartStore";
import { createOrder } from "@/server/actions/order";

export default function CartPage(): React.ReactElement {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [orderRef, setOrderRef] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Zustand store เริ่มต้น items=[] ทั้ง SSR/client จึงไม่ต้องกัน hydration mismatch
  const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.totalPrice, 0);

  async function handleCheckout(): Promise<void> {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await createOrder(items);
      if (result.success && result.orderId) {
        clearCart();
        setOrderRef(result.orderId);
      } else {
        setErrorMessage(result.message ?? "Failed to place order.");
      }
    } catch {
      setErrorMessage("An unexpected error occurred during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Success state — แสดงเลขอ้างอิงสั่งซื้อ
  if (orderRef) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-2xl border border-[#E8E0D5] bg-white px-8 py-12 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#CC785C]/10 text-[#CC785C]">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-[#2D2825]">
            Quotation Requested
          </h1>
          <p className="mb-6 text-[#736B66]">
            Your B2B order has been received. Our team will review the details and
            contact you shortly.
          </p>
          <div className="mb-8 inline-flex flex-col items-center rounded-xl border border-[#E8E0D5] bg-[#F5F0E8] px-6 py-4">
            <span className="text-xs font-medium uppercase tracking-wider text-[#736B66]">
              Order Reference
            </span>
            <span className="mt-1 font-mono text-lg font-semibold text-[#2D2825]">
              #{orderRef.substring(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/products">
              <Button className="w-full bg-[#CC785C] text-white hover:bg-[#B86548] sm:w-auto">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse our wholesale catalog to start building your quote."
          ctaLabel="Browse Products"
          ctaHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825]">
            Cart & Quotation
          </h1>
          <p className="mt-1 text-sm text-[#736B66]">
            Review your bulk items before submitting your order.
          </p>
        </div>
        <Link
          href="/products"
          className="hidden items-center text-sm font-medium text-[#CC785C] hover:text-[#B86548] sm:inline-flex"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Line items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="rounded-2xl border border-[#E8E0D5] bg-white p-4 shadow-sm md:p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.product.id}`}
                    className="block truncate text-base font-semibold text-[#2D2825] hover:text-[#CC785C]"
                  >
                    {item.product.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#736B66]">
                    <span className="font-mono">SKU: {item.product.sku}</span>
                    <span>
                      Unit:{" "}
                      <span className="font-medium text-[#CC785C]">
                        ฿
                        {item.appliedTierUnitPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <QuantityInput
                    value={item.quantity}
                    onChange={(next) => updateQuantity(item.product.id, next)}
                    min={item.product.moq}
                    max={item.product.stock > 0 ? item.product.stock : undefined}
                  />

                  <div className="min-w-[110px] text-right">
                    <p className="text-[10px] uppercase tracking-wider text-[#736B66]">
                      Line total
                    </p>
                    <p className="text-lg font-bold text-[#2D2825]">
                      ฿
                      {item.totalPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id)}
                    aria-label={`Remove ${item.product.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#736B66] transition-colors hover:bg-[#CC785C]/10 hover:text-[#CC785C]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Mobile continue shopping */}
          <div className="pt-2 sm:hidden">
            <Link
              href="/products"
              className="inline-flex items-center text-sm font-medium text-[#CC785C] hover:text-[#B86548]"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl border border-[#E8E0D5] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2D2825]">Order Summary</h2>

            <dl className="mt-4 space-y-3 border-b border-[#E8E0D5] pb-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#736B66]">Items</dt>
                <dd className="font-medium text-[#2D2825]">{items.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#736B66]">Total quantity</dt>
                <dd className="font-medium text-[#2D2825]">{totalQuantity}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#736B66]">Subtotal</dt>
                <dd className="font-medium text-[#2D2825]">
                  ฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-xs text-[#736B66]">
              Shipping & taxes will be calculated at quotation review.
            </p>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-base font-semibold text-[#2D2825]">Total</span>
              <span className="text-2xl font-bold text-[#CC785C]">
                ฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <Button
              type="button"
              size="lg"
              onClick={handleCheckout}
              disabled={isSubmitting || items.length === 0}
              className="mt-6 w-full bg-[#CC785C] py-6 text-base text-white shadow-sm hover:bg-[#B86548] disabled:bg-[#E8E0D5] disabled:text-[#736B66]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Place Order"
              )}
            </Button>

            <button
              type="button"
              onClick={() => clearCart()}
              disabled={isSubmitting}
              className="mt-3 w-full text-center text-xs font-medium text-[#736B66] hover:text-[#CC785C] disabled:opacity-50"
            >
              Clear cart
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
