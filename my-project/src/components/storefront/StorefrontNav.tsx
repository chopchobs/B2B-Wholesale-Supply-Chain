import * as React from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { CartBadge } from "@/components/storefront/CartBadge";

export function StorefrontNav(): React.ReactElement {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E8E0D5] bg-[#F5F0E8]/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo + brand */}
        <Link
          href="/products"
          className="flex items-center gap-2 text-[#2D2825] transition-opacity hover:opacity-80"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#CC785C] text-white">
            <Package className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            B2B Wholesale
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/products"
            className="text-sm font-medium text-[#2D2825] transition-colors hover:text-[#CC785C]"
          >
            Browse Products
          </Link>
          <Link
            href="/cart"
            className="text-sm font-medium text-[#2D2825] transition-colors hover:text-[#CC785C]"
          >
            Cart
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <CartBadge />
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-lg border border-[#E8E0D5] bg-white px-4 text-sm font-medium text-[#2D2825] transition-colors hover:border-[#CC785C]/40 hover:text-[#CC785C]"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
