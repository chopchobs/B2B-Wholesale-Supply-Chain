import React from "react";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { OrderTableClient } from "@/components/merchant/OrderTableClient";

export const dynamic = "force-dynamic";

// Type inferred from the Prisma query shape with Decimal fields serialized to number
type SerializedOrder = Omit<
  Prisma.OrderGetPayload<{
    include: {
      user: { select: { name: true; email: true } };
      items: { include: { product: { select: { name: true; sku: true } } } };
    };
  }>,
  "totalAmount" | "items"
> & {
  totalAmount: number;
  items: Array<
    Omit<
      Prisma.OrderItemGetPayload<{
        include: { product: { select: { name: true; sku: true } } };
      }>,
      "unitPrice" | "subTotal"
    > & { unitPrice: number; subTotal: number }
  >;
};

export default async function OrdersPage() {
  let orders: SerializedOrder[] = [];
  let dbError = null;

  try {
    const rawOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true }
        },
        items: {
          include: {
            product: { select: { name: true, sku: true } }
          }
        }
      }
    });

    // Serialize Decimal to Number safely for Client Components
    orders = rawOrders.map(order => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        subTotal: Number(item.subTotal)
      }))
    }));

  } catch (error: unknown) {
    console.error("Failed to fetch orders:", error);
    dbError = error instanceof Error ? error.message : "An unexpected error occurred.";
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Order Management</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all B2B orders and quotation requests from your customers.
          </p>
        </div>
      </div>

      {dbError ? (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium">
          Error loading orders: {dbError}
        </div>
      ) : (
        <OrderTableClient orders={orders} />
      )}
    </div>
  );
}
