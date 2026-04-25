"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CartItem } from "@/store/useCartStore";

export async function createOrder(cartItems: CartItem[]) {
  try {
    if (!cartItems || cartItems.length === 0) {
      return { success: false, message: "Cart is empty." };
    }

    // Dummy user and shop placeholders (since we don't have Auth yet)
    // In a real application, you'd get this from your Auth context/session
    // We will hardcode or dynamically ensure a User exists for now.
    
    // For simplicity, we'll try to find an admin/merchant user or create a dummy one
    let dummyUser = await prisma.user.findFirst();
    if (!dummyUser) {
      dummyUser = await prisma.user.create({
        data: {
          email: "dummy.buyer@example.com",
          password: "hashedpassword123",
          name: "Dummy Buyer",
        },
      });
    }

    const totalAmount = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);

    // 1. Create the Order with nested OrderItems in a single Prisma transaction
    const newOrder = await prisma.order.create({
      data: {
        userId: dummyUser.id,
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
