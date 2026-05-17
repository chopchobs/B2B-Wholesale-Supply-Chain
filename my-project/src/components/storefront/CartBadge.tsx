"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export function CartBadge(): React.ReactElement {
  // Zustand store เริ่มต้นเป็น [] ทั้งฝั่ง SSR และ client จึงไม่เกิด hydration mismatch
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Link
      href="/cart"
      aria-label="View cart"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E0D5] bg-white text-[#2D2825] transition-colors hover:border-[#CC785C]/40 hover:text-[#CC785C]"
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#CC785C] px-1 text-[10px] font-semibold text-white">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      ) : null}
    </Link>
  );
}
