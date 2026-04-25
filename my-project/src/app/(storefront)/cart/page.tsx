"use client";

import React, { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, Loader2, ArrowLeft } from "lucide-react";
import { createOrder } from "@/server/actions/order";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CartPage() {
  const { items, removeItem, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const router = useRouter();

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce((acc, item) => acc + item.totalPrice, 0);

  const handleCheckout = async () => {
    setIsSubmitting(true);
    try {
      const result = await createOrder(items);
      if (result.success) {
        clearCart();
        setOrderSuccess(true);
      } else {
        alert("Failed to place order: " + result.message);
      }
    } catch (error) {
      alert("An error occurred during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl text-center">
        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Quotation Requested!</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Your B2B order has been successfully placed. Our team will review the details and contact you shortly.
        </p>
        <Link href="/products">
          <Button className="bg-primary hover:bg-primary/90">
            Return to Catalog
          </Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl text-center">
        <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">
          Browse our catalog to add wholesale items to your cart.
        </p>
        <Link href="/products">
          <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/5">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Go back to catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Cart & Quotation</h1>
        <p className="text-muted-foreground mt-2">Review your bulk items before submitting your order.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-muted/30 border-b text-sm font-medium text-muted-foreground">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            {/* Items */}
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.product.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center relative hover:bg-muted/10 transition-colors">
                  <div className="md:col-span-6 flex flex-col">
                    <span className="font-semibold text-foreground text-lg md:text-base">
                      {item.product.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono mt-1">
                      SKU: {item.product.sku}
                    </span>
                    {/* Mobile Price details */}
                    <div className="md:hidden flex justify-between mt-2 text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity} × ฿{item.appliedTierUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="font-semibold text-primary">
                        ฿{item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="hidden md:block col-span-2 text-right font-medium text-muted-foreground">
                    ฿{item.appliedTierUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  
                  <div className="hidden md:block col-span-2 text-center">
                    <span className="inline-block px-3 py-1 bg-muted rounded-md font-mono text-sm">
                      {item.quantity}
                    </span>
                  </div>
                  
                  <div className="hidden md:block col-span-2 text-right font-bold text-primary">
                    ฿{item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.product.id)}
                    className="absolute top-4 right-4 md:static md:col-span-12 text-destructive hover:bg-destructive/10 hover:text-destructive md:ml-auto w-8 h-8 md:-mt-10"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border shadow-sm p-6 sticky top-8">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 text-sm mb-6 pb-6 border-b border-border/50">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Items</span>
                <span className="font-medium text-foreground">{items.length}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Quantity</span>
                <span className="font-medium text-foreground">{totalQuantity}</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="text-base font-semibold">Total Amount</span>
              <span className="text-3xl font-bold text-primary">
                ฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base py-6 shadow-md"
              onClick={handleCheckout}
              disabled={isSubmitting || items.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Request Quotation"
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
