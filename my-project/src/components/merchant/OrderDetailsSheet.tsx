"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface OrderItemType {
  id: string;
  product: {
    name: string;
    sku: string;
  };
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

interface OrderDetailsProps {
  order: {
    id: string;
    createdAt: Date;
    status: string;
    totalAmount: number;
    user: {
      name: string | null;
      email: string;
    };
    items: OrderItemType[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsSheet({ order, isOpen, onClose }: OrderDetailsProps) {
  if (!order) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl flex flex-col h-full overflow-hidden">
        <SheetHeader className="shrink-0 mb-6 border-b pb-4">
          <div className="flex items-center justify-between mt-2">
            <div>
              <SheetTitle className="text-2xl">Order Details</SheetTitle>
              <SheetDescription className="text-sm font-mono mt-1">
                #{order.id}
              </SheetDescription>
            </div>
            <Badge variant={
              order.status === "DELIVERED" ? "success" :
              order.status === "CANCELLED" ? "destructive" :
              order.status === "PENDING" ? "warning" : "info"
            } className="text-sm px-3 py-1">
              {order.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-4 -mr-4 px-1 pb-6 space-y-8">
          {/* Customer Info */}
          <section className="bg-muted/30 p-4 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4 text-foreground">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Name / Company</p>
                <p className="font-medium">{order.user.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{order.user.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Order Date</p>
                <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </section>

          {/* Items Table */}
          <section>
            <h3 className="font-semibold text-lg mb-4 text-foreground">Order Items</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {item.product.sku}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ฿{Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-block px-2 py-0.5 bg-muted rounded font-mono text-xs">
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{Number(item.subTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>

        {/* Footer Summary */}
        <div className="shrink-0 pt-6 pb-4 border-t mt-auto bg-background">
          <div className="flex justify-between items-end">
            <span className="text-lg font-semibold text-muted-foreground">Grand Total</span>
            <span className="text-3xl font-bold text-primary">
              ฿{Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
