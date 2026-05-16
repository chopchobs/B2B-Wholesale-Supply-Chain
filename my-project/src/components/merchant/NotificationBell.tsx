"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Package,
  ShoppingCart,
  FileText,
  Truck,
  ClipboardList,
  AlertTriangle,
  Info,
  CheckCheck,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Types ---

type NotificationType =
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "NEW_ORDER"
  | "ORDER_STATUS_CHANGED"
  | "INVOICE_OVERDUE"
  | "SHIPMENT_UPDATE"
  | "PURCHASE_ORDER_UPDATE"
  | "SYSTEM";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string; // ISO from API
}

interface NotificationApiResponse {
  data: {
    notifications: NotificationItem[];
    unreadCount: number;
  } | null;
  error: string | null;
}

// --- Helpers ---

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function iconForType(type: NotificationType): React.ReactElement {
  const cls = "h-4 w-4";
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

// --- Component ---

export function NotificationBell(): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = React.useState<boolean>(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unread, setUnread] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);

  // ดึง notifications จาก API
  const fetchData = React.useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const json = (await res.json()) as NotificationApiResponse;
      if (json.data) {
        setItems(json.data.notifications.slice(0, 10));
        setUnread(json.data.unreadCount);
      }
    } catch (err: unknown) {
      console.error("fetch notifications failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // โหลดครั้งแรก + poll ทุก 30s
  // ใช้ setTimeout 0 เพื่อหลีกเลี่ยง setState synchronously ใน effect body
  React.useEffect(() => {
    const first = setTimeout(() => {
      void fetchData();
    }, 0);
    const id = setInterval(() => {
      void fetchData();
    }, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [fetchData]);

  // เมื่อเปิด popover → mark all as read อัตโนมัติ
  React.useEffect(() => {
    if (!open || unread === 0) return;
    const run = async (): Promise<void> => {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true }),
        });
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
        router.refresh();
      } catch (err: unknown) {
        console.error("auto mark all read failed:", err);
      }
    };
    run();
  }, [open, unread, router]);

  async function handleMarkAllRead(): Promise<void> {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      router.refresh();
    } catch (err: unknown) {
      console.error("mark all read failed:", err);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Notifications"
          className="relative border-[#E8E0D5] bg-white text-[#2D2825] hover:bg-[#F5F0E8]"
        >
          <Bell className="h-4 w-4 text-[#CC785C]" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-[#E8E0D5] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#2D2825]">
              Notifications
            </p>
            <p className="text-xs text-[#736B66]">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-xs font-medium text-[#CC785C] hover:text-[#B86548]"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[#736B66]">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[#736B66]">
              No notifications yet.
            </div>
          ) : (
            <ul className="divide-y divide-[#E8E0D5]">
              {items.map((n) => {
                const content = (
                  <div
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-[#F5F0E8]",
                      !n.isRead && "bg-[#F5F0E8]/60"
                    )}
                  >
                    <div className="mt-0.5">{iconForType(n.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-[#2D2825]">
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#CC785C]" />
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs text-[#736B66]">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[11px] text-[#736B66]">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => setOpen(false)}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-[#E8E0D5] px-4 py-2 text-center">
          <Link
            href="/merchant/notifications"
            onClick={() => setOpen(false)}
            className="text-xs font-medium text-[#CC785C] hover:text-[#B86548]"
          >
            View all →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
