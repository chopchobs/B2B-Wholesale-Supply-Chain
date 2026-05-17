import Link from "next/link";
import { CheckCircle2, AlertTriangle, PackageX } from "lucide-react";
import type { LowStockItem } from "@/lib/analytics";

interface LowStockPanelProps {
  items: LowStockItem[];
}

// คืน class สำหรับตัวเลข quantity ตามระดับความรุนแรง
function quantityClass(qty: number): string {
  if (qty === 0) return "text-[#CC785C]";
  if (qty < 5) return "text-amber-600";
  return "text-[#2D2825]";
}

function quantityIcon(qty: number) {
  if (qty === 0) return <PackageX className="h-3.5 w-3.5 text-[#CC785C]" />;
  if (qty < 5) return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
  return null;
}

export function LowStockPanel({ items }: LowStockPanelProps) {
  return (
    <div className="rounded-lg bg-white border border-[#E8E0D5] shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E0D5]">
        <div>
          <h2 className="text-base font-semibold text-[#2D2825]">Low Stock Alerts</h2>
          <p className="text-xs text-[#736B66] mt-0.5">
            Items at or below their reorder point
          </p>
        </div>
        <Link
          href="/merchant/inventory"
          className="text-xs font-medium text-[#CC785C] hover:text-[#B86548]"
        >
          View inventory →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 px-6 text-sm text-[#736B66]">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-2" />
          All stock levels are healthy.
        </div>
      ) : (
        <ul className="divide-y divide-[#E8E0D5]">
          {items.map((item) => (
            <li
              key={item.sku}
              className="flex items-center justify-between px-5 py-3 hover:bg-[#F5F0E8]/40 transition-colors"
            >
              <div className="min-w-0 pr-3">
                <p className="text-sm font-medium text-[#2D2825] truncate">
                  {item.productName}
                </p>
                <p className="text-[11px] text-[#736B66] font-mono">SKU: {item.sku}</p>
              </div>
              <div className="text-right shrink-0">
                <div
                  className={`flex items-center justify-end gap-1 text-sm font-semibold ${quantityClass(item.quantity)}`}
                >
                  {quantityIcon(item.quantity)}
                  {item.quantity} left
                </div>
                {item.reorderPoint !== null && (
                  <p className="text-[11px] text-[#736B66] mt-0.5">
                    Reorder at {item.reorderPoint}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
