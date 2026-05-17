"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Package,
  ShoppingCart,
  FileText,
  Users,
  UsersRound,
  Truck,
  ClipboardList,
  RotateCcw,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Phase 18+: รายการเมนูหลักของ merchant dashboard
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "main" | "operations" | "system";
}

const NAV_ITEMS: NavItem[] = [
  { href: "/merchant", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/merchant/inventory", label: "Inventory", icon: Boxes, group: "main" },
  { href: "/merchant/products", label: "Products", icon: Package, group: "main" },
  { href: "/merchant/orders", label: "Orders", icon: ShoppingCart, group: "main" },
  { href: "/merchant/invoices", label: "Invoices", icon: FileText, group: "main" },

  { href: "/merchant/customers", label: "Customers", icon: Users, group: "operations" },
  { href: "/merchant/users", label: "Users", icon: UsersRound, group: "operations" },
  { href: "/merchant/suppliers", label: "Suppliers", icon: Truck, group: "operations" },
  { href: "/merchant/purchase-orders", label: "Purchase Orders", icon: ClipboardList, group: "operations" },
  { href: "/merchant/shipping", label: "Shipping", icon: Truck, group: "operations" },
  { href: "/merchant/returns", label: "Returns", icon: RotateCcw, group: "operations" },

  { href: "/merchant/reports", label: "Reports", icon: BarChart3, group: "system" },
  { href: "/merchant/settings", label: "Settings", icon: SettingsIcon, group: "system" },
];

const GROUP_LABELS: Record<NavItem["group"], string> = {
  main: "Overview",
  operations: "Operations",
  system: "System",
};

interface MerchantSidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function MerchantSidebar({ onNavigate, className }: MerchantSidebarProps): React.ReactElement {
  const pathname = usePathname();

  // ตรวจสอบว่า link ปัจจุบันถูก active หรือไม่
  function isActive(href: string): boolean {
    if (href === "/merchant") {
      return pathname === "/merchant";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const groups: NavItem["group"][] = ["main", "operations", "system"];

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col bg-white border-r border-[#E8E0D5]",
        className,
      )}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-[#E8E0D5] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#CC785C] text-white shadow-sm">
          <Package className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#2D2825] leading-tight">
            B2B Wholesale
          </p>
          <p className="truncate text-[11px] text-[#736B66] leading-tight">
            Merchant Console
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((group) => (
          <div key={group} className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#736B66]">
              {GROUP_LABELS[group]}
            </p>
            {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#CC785C] text-white shadow-sm hover:bg-[#B86548]"
                      : "text-[#2D2825] hover:bg-[#F5F0E8] hover:text-[#2D2825]",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-white" : "text-[#CC785C] group-hover:text-[#B86548]",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#E8E0D5] px-6 py-3">
        <p className="text-[11px] text-[#736B66]">
          © {new Date().getFullYear()} B2B Wholesale
        </p>
      </div>
    </aside>
  );
}
