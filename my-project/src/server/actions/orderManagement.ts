"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { createNotification } from "@/server/actions/notifications";

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    // Validate if the status is a valid OrderStatus enum value
    if (!Object.values(OrderStatus).includes(newStatus as OrderStatus)) {
      return { success: false, message: "Invalid status value." };
    }

    // ดึงสถานะเดิมเพื่อตรวจสอบการเปลี่ยนแปลงจริง ก่อน update
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, userId: true },
    });
    if (!existing) {
      return { success: false, message: "Order not found." };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as OrderStatus },
    });

    // ส่ง notification เฉพาะเมื่อสถานะเปลี่ยนจริง
    if (existing.status !== (newStatus as OrderStatus)) {
      await createNotification({
        userId: existing.userId,
        type: "ORDER_STATUS_CHANGED",
        title: `Order status updated`,
        message: `Your order #${orderId.substring(0, 8)} has been updated to ${newStatus}.`,
        link: `/merchant/orders`,
        metadata: {
          orderId,
          previousStatus: existing.status,
          newStatus,
        },
      });
    }

    revalidatePath("/merchant/orders");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update order status:", error);
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return { success: false, message };
  }
}
