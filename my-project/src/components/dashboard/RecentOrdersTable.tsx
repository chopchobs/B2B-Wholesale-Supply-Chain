import Link from "next/link";
import { Inbox } from "lucide-react";
import type { RecentOrder } from "@/lib/analytics";

interface RecentOrdersTableProps {
  orders: RecentOrder[];
}

// คืน class สำหรับ status badge แบบสีอ่อน (พื้นหลัง tint, ข้อความเข้ม)
function statusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-[#D4A574]/20 text-[#8C6A3E] border-[#D4A574]/40";
    case "PROCESSING":
    case "CONFIRMED":
      return "bg-[#CC785C]/10 text-[#B86548] border-[#CC785C]/30";
    case "SHIPPED":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "CANCELLED":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-[#F5F0E8] text-[#736B66] border-[#E8E0D5]";
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <div className="rounded-lg bg-white border border-[#E8E0D5] shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E0D5]">
        <div>
          <h2 className="text-base font-semibold text-[#2D2825]">Recent Orders</h2>
          <p className="text-xs text-[#736B66] mt-0.5">Latest activity from buyers</p>
        </div>
        <Link
          href="/merchant/orders"
          className="text-xs font-medium text-[#CC785C] hover:text-[#B86548]"
        >
          View all →
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 px-6 text-sm text-[#736B66]">
          <Inbox className="h-8 w-8 text-[#D4A574] mb-2" />
          No orders yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#736B66] bg-[#F5F0E8]/60">
                <th className="px-5 py-2.5 font-medium">Order</th>
                <th className="px-5 py-2.5 font-medium">Customer</th>
                <th className="px-5 py-2.5 font-medium text-right">Total</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-[#E8E0D5] hover:bg-[#F5F0E8]/40 transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-xs text-[#2D2825]">
                    #{o.id.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3 text-[#2D2825]">{o.customerName}</td>
                  <td className="px-5 py-3 text-right font-medium text-[#2D2825]">
                    ฿{o.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusBadgeClass(o.status)}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-[#736B66]">
                    {formatDate(o.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
