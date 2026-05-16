"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CartItem } from "@/store/useCartStore";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/server/actions/notifications";

export async function createOrder(cartItems: CartItem[]) {
  try {
    if (!cartItems || cartItems.length === 0) {
      return { success: false, message: "Cart is empty." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "You must be logged in to place an order." };
    }

    // We use the authenticated user's ID to link the order
    const userId = user.id;

    const totalAmount = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);

    // 1. Create the Order with nested OrderItems in a single Prisma transaction
    const newOrder = await prisma.order.create({
      data: {
        userId: userId,
        totalAmount,
        status: "PENDING",
        items: {
          create: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.appliedTierUnitPrice,
            subTotal: item.totalPrice,
          })),
        },
      },
    });

    // 2. Revalidate storefront routes if needed
    revalidatePath("/products");

    // 3. แจ้งเตือน merchant/admin ทุกคนว่ามี order ใหม่
    try {
      const merchants = await prisma.user.findMany({
        where: { role: { in: ["MERCHANT", "ADMIN"] }, isActive: true },
        select: { id: true },
      });
      await Promise.all(
        merchants.map((m) =>
          createNotification({
            userId: m.id,
            type: "NEW_ORDER",
            title: `New order received`,
            message: `A new order #${newOrder.id.substring(0, 8)} (฿${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}) has been placed.`,
            link: `/merchant/orders`,
            metadata: { orderId: newOrder.id, totalAmount },
          })
        )
      );
    } catch (notifyError: unknown) {
      console.error("New order notification failed:", notifyError);
    }

    return { success: true, orderId: newOrder.id };
  } catch (error: unknown) {
    console.error("Failed to create order:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}
