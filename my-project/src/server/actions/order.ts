"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CartItem } from "@/store/useCartStore";
import { createClient } from "@/lib/supabase/server";

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
    
    return { success: true, orderId: newOrder.id };
  } catch (error: any) {
    console.error("Failed to create order:", error);
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}
