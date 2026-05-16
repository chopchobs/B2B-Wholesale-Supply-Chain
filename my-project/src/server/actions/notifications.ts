"use server";

import { prisma } from "@/lib/prisma";
import { NotificationType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface NotificationFilter {
  isRead?: boolean;
  type?: NotificationType | NotificationType[];
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
}

// --- Helpers ---

function toItem(
  n: {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    link: string | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
  }
): NotificationItem {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    link: n.link,
    metadata:
      n.metadata && typeof n.metadata === "object" && !Array.isArray(n.metadata)
        ? (n.metadata as Record<string, unknown>)
        : null,
    createdAt: n.createdAt,
  };
}

// --- Queries ---

export async function getNotifications(
  userId: string,
  filter?: NotificationFilter
): Promise<ActionResult<NotificationItem[]>> {
  try {
    const where: Prisma.NotificationWhereInput = { userId };
    if (filter?.isRead !== undefined) {
      where.isRead = filter.isRead;
    }
    if (filter?.type) {
      where.type = Array.isArray(filter.type)
        ? { in: filter.type }
        : filter.type;
    }

    const list = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { data: list.map(toItem), error: null };
  } catch (error: unknown) {
    console.error("getNotifications failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load notifications.";
    return { data: null, error: message };
  }
}

export async function getUnreadCount(
  userId: string
): Promise<ActionResult<number>> {
  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { data: count, error: null };
  } catch (error: unknown) {
    console.error("getUnreadCount failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load unread count.";
    return { data: null, error: message };
  }
}

// --- Mutations ---

export async function markAsRead(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    revalidatePath("/merchant/notifications");
    revalidatePath("/merchant");
    return { data: { id: updated.id }, error: null };
  } catch (error: unknown) {
    console.error("markAsRead failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to mark notification as read.";
    return { data: null, error: message };
  }
}

export async function markAllAsRead(
  userId: string
): Promise<ActionResult<{ count: number }>> {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    revalidatePath("/merchant/notifications");
    revalidatePath("/merchant");
    return { data: { count: result.count }, error: null };
  } catch (error: unknown) {
    console.error("markAllAsRead failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to mark all as read.";
    return { data: null, error: message };
  }
}

export async function deleteNotification(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const deleted = await prisma.notification.delete({ where: { id } });
    revalidatePath("/merchant/notifications");
    revalidatePath("/merchant");
    return { data: { id: deleted.id }, error: null };
  } catch (error: unknown) {
    console.error("deleteNotification failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete notification.";
    return { data: null, error: message };
  }
}

// Internal helper สำหรับสร้าง notification จาก server action อื่นๆ
export async function createNotification(
  input: CreateNotificationInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.userId) {
      return { data: null, error: "userId is required." };
    }
    if (!input.title?.trim() || !input.message?.trim()) {
      return { data: null, error: "Title and message are required." };
    }

    const created = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title.trim(),
        message: input.message.trim(),
        link: input.link ?? null,
        metadata:
          input.metadata !== undefined && input.metadata !== null
            ? (input.metadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
      },
    });

    return { data: { id: created.id }, error: null };
  } catch (error: unknown) {
    console.error("createNotification failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create notification.";
    return { data: null, error: message };
  }
}

// Helper สำหรับเช็คและสร้าง notification ของ overdue invoices
export async function checkOverdueInvoices(): Promise<
  ActionResult<{ created: number }>
> {
  try {
    const now = new Date();

    // หา invoices ที่เลย dueDate และยังไม่ PAID/CANCELLED
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ["DRAFT", "SENT", "OVERDUE"] },
      },
      include: {
        order: { select: { userId: true } },
      },
    });

    let created = 0;
    for (const invoice of overdueInvoices) {
      // ป้องกัน duplicate: เช็คว่ามี notification INVOICE_OVERDUE สำหรับ invoice นี้ภายใน 24 ชม. ไหม
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const existing = await prisma.notification.findFirst({
        where: {
          userId: invoice.order.userId,
          type: "INVOICE_OVERDUE",
          createdAt: { gte: dayAgo },
          metadata: { path: ["invoiceId"], equals: invoice.id },
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          userId: invoice.order.userId,
          type: "INVOICE_OVERDUE",
          title: `Invoice ${invoice.invoiceNumber} is overdue`,
          message: `Payment for invoice ${invoice.invoiceNumber} (฿${Number(
            invoice.total
          ).toLocaleString(undefined, { minimumFractionDigits: 2 })}) was due on ${invoice.dueDate.toLocaleDateString()}.`,
          link: `/merchant/invoices/${invoice.id}`,
          metadata: { invoiceId: invoice.id, dueDate: invoice.dueDate.toISOString() },
        },
      });
      created += 1;
    }

    if (created > 0) {
      revalidatePath("/merchant/notifications");
      revalidatePath("/merchant");
    }

    return { data: { created }, error: null };
  } catch (error: unknown) {
    console.error("checkOverdueInvoices failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to check overdue invoices.";
    return { data: null, error: message };
  }
}
