"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    // Validate if the status is a valid OrderStatus enum value
    if (!Object.values(OrderStatus).includes(newStatus as OrderStatus)) {
      return { success: false, message: "Invalid status value." };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as OrderStatus },
    });

    revalidatePath("/merchant/orders");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update order status:", error);
    return { success: false, message: error.message || "Something went wrong." };
  }
}
