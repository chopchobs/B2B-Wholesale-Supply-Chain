"use client";

import React, { useState, useMemo } from "react";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useCartStore,
  calculateUnitPrice,
  CartProduct,
} from "@/store/useCartStore";

interface ProductCardProps {
  product: CartProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState<number>(product.moq);
  const addItem = useCartStore((state) => state.addItem);

  // Real-time calculation of the unit price based on the current inputted quantity
  const currentUnitPrice = useMemo(() => {
    return calculateUnitPrice(product.basePrice, quantity, product.priceTiers);
  }, [product.basePrice, quantity, product.priceTiers]);

  const totalPrice = currentUnitPrice * quantity;

  const handleAdd = () => {
    if (quantity >= product.moq) {
      addItem(product, quantity);
      // Optional: show a toast notification here
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setQuantity(val);
    } else {
      setQuantity(product.moq); // fallback
    }
  };

  return (
    <Card className="flex flex-col h-full border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <Badge
            variant="outline"
            className="text-xs font-mono text-muted-foreground"
          >
            {product.sku}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary hover:bg-primary/20"
          >
            MOQ: {product.moq}
          </Badge>
        </div>
        <CardTitle className="text-xl line-clamp-2">{product.name}</CardTitle>
        <div className="mt-2 text-2xl font-bold text-foreground">
          ฿
          {product.basePrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
          <span className="text-sm font-normal text-muted-foreground ml-1">
            / unit
          </span>
        </div>
      </CardHeader>

      <CardContent className="grow space-y-4">
        {/* Tiered Pricing Summary Display */}
        {product.priceTiers && product.priceTiers.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Volume Discounts
            </p>
            <ul className="space-y-1">
              {product.priceTiers
                .sort((a, b) => a.minQuantity - b.minQuantity)
                .map((tier) => (
                  <li key={tier.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Buy {tier.minQuantity}+
                    </span>
                    <span className="font-medium text-primary">
                      ฿
                      {tier.unitPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-border/50 bg-muted/5 rounded-b-xl">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex flex-col flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Quantity
            </label>
            <Input
              type="number"
              min={product.moq}
              value={quantity}
              onChange={handleQuantityChange}
              className="font-mono text-center"
            />
          </div>
          <div className="flex flex-col flex-1 text-right">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Est. Unit Price
            </label>
            <span
              className={`text-lg font-bold ${currentUnitPrice < product.basePrice ? "text-green-600 dark:text-green-400" : "text-foreground"}`}
            >
              ฿
              {currentUnitPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="w-full flex justify-between items-center text-sm mb-2">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-bold text-lg">
            ฿
            {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <Button
          onClick={handleAdd}
          disabled={quantity < product.moq}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Quote
        </Button>
      </CardFooter>
    </Card>
  );
}
