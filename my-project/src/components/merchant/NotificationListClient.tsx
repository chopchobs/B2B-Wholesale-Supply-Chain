"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingCart,
  FileText,
  Truck,
  ClipboardList,
  AlertTriangle,
  Info,
  CheckCheck,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  markAllAsRead,
  markAsRead,
  deleteNotification,
  type NotificationItem,
} from "@/server/actions/notifications";

// --- Types ---

type FilterKey = "ALL" | "UNREAD" | "ORDERS" | "INVENTORY" | "INVOICES";

interface NotificationListClientProps {
  initialItems: NotificationItem[];
  userId: string;
}

// --- Helpers ---

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.max(0, Date.now() - d.getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}

function iconForType(type: NotificationItem["type"]): React.ReactElement {
  const cls = "h-5 w-5";
  switch (type) {
    case "LOW_STOCK":
      return <AlertTriangle className={cn(cls, "text-[#CC785C]")} />;
    case "OUT_OF_STOCK":
      return <AlertTriangle className={cn(cls, "text-red-600")} />;
    case "NEW_ORDER":
      return <ShoppingCart className={cn(cls, "text-[#CC785C]")} />;
    case "ORDER_STATUS_CHANGED":
      return <Package className={cn(cls, "text-[#D4A574]")} />;
    case "INVOICE_OVERDUE":
      return <FileText className={cn(cls, "text-red-600")} />;
    case "SHIPMENT_UPDATE":
      return <Truck className={cn(cls, "text-[#CC785C]")} />;
    case "PURCHASE_ORDER_UPDATE":
      return <ClipboardList className={cn(cls, "text-[#D4A574]")} />;
    case "SYSTEM":
    default:
      return <Info className={cn(cls, "text-[#736B66]")} />;
  }
}

function matchesFilter(
  item: NotificationItem,
  filter: FilterKey
): boolean {
  if (filter === "ALL") return true;
  if (filter === "UNREAD") return !item.isRead;
  if (filter === "ORDERS")
    return item.type === "NEW_ORDER" || item.type === "ORDER_STATUS_CHANGED";
  if (filter === "INVENTORY")
    return item.type === "LOW_STOCK" || item.type === "OUT_OF_STOCK";
  if (filter === "INVOICES") return item.type === "INVOICE_OVERDUE";
  return true;
}

// --- Component ---

export function NotificationListClient({
  initialItems,
  userId,
}: NotificationListClientProps): React.ReactElement {
  const router = useRouter();
  const [items, setItems] = React.useState<NotificationItem[]>(initialItems);
  const [filter, setFilter] = React.useState<FilterKey>("ALL");
  const [pending, setPending] = React.useState<string | null>(null);

  const filtered = items.filter((it) => matchesFilter(it, filter));
  const unreadCount = items.filter((it) => !it.isRead).length;

  async function handleMarkAll(): Promise<void> {
    const res = await markAllAsRead(userId);
    if (!res.error) {
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      router.refresh();
    }
  }

  async function handleMark(id: string): Promise<void> {
    setPending(id);
    const res = await markAsRead(id);
    if (!res.error) {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      router.refresh();
    }
    setPending(null);
  }

  async function handleDelete(id: string): Promise<void> {
    setPending(id);
    const res = await deleteNotification(id);
    if (!res.error) {
      setItems((prev) => prev.filter((n) => n.id !== id));
      router.refresh();
    }
    setPending(null);
  }

  const tabs: Array<{ key: FilterKey; label: string }> = [
    { key: "ALL", label: "All" },
    { key: "UNREAD", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { key: "ORDERS", label: "Orders" },
    { key: "INVENTORY", label: "Inventory" },
    { key: "INVOICES", label: "Invoices" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === t.key
                  ? "border-[#CC785C] bg-[#CC785C] text-white"
                  : "border-[#E8E0D5] bg-white text-[#2D2825] hover:bg-[#F5F0E8]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAll}
          disabled={unreadCount === 0}
          className="border-[#E8E0D5] text-[#CC785C] hover:bg-[#F5F0E8]"
        >
          <CheckCheck className="mr-1.5 h-4 w-4" />
          Mark all read
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-[#E8E0D5] bg-white px-6 py-16 text-center">
          <Info className="mx-auto mb-3 h-8 w-8 text-[#736B66]" />
          <p className="text-sm font-medium text-[#2D2825]">
            No notifications
          </p>
          <p className="mt-1 text-xs text-[#736B66]">
            You&apos;re all caught up.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => (
            <li
              key={n.id}
              className={cn(
                "flex items-start gap-4 rounded-md border bg-white px-4 py-3 transition-colors",
                n.isRead
                  ? "border-[#E8E0D5]"
                  : "border-[#CC785C]/40 bg-[#F5F0E8]/60"
              )}
            >
              <div className="mt-1">{iconForType(n.type)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#2D2825]">
                    {n.title}
                  </p>
                  {!n.isRead && (
                    <Badge
                      variant="outline"
                      className="border-[#CC785C] bg-[#CC785C]/10 text-[10px] text-[#CC785C]"
                    >
                      NEW
                    </Badge>
                  )}
                  <span className="text-[11px] text-[#736B66]">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#736B66]">{n.message}</p>
                {n.link && (
                  <Link
                    href={n.link}
                    className="mt-1 inline-block text-xs font-medium text-[#CC785C] hover:text-[#B86548]"
                  >
                    View details →
                  </Link>
                )}
              </div>
              <div className="flex flex-shrink-0 flex-col gap-1 sm:flex-row">
                {!n.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending === n.id}
                    onClick={() => handleMark(n.id)}
                    className="h-7 border-[#E8E0D5] px-2 text-[11px] text-[#2D2825] hover:bg-[#F5F0E8]"
                  >
                    Mark read
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending === n.id}
                  onClick={() => handleDelete(n.id)}
                  aria-label="Delete"
                  className="h-7 border-[#E8E0D5] px-2 text-[#736B66] hover:bg-[#F5F0E8] hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
