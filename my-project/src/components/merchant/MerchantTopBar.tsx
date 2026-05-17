"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/merchant/NotificationBell";
import { MerchantSidebar } from "@/components/merchant/MerchantSidebar";

export function MerchantTopBar(): React.ReactElement {
  // mobile drawer state
  const [open, setOpen] = React.useState<boolean>(false);

  function handleNavigate(): void {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#E8E0D5] bg-white/90 backdrop-blur px-4 lg:px-6">
      {/* Mobile hamburger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-[#2D2825] hover:bg-[#F5F0E8]"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-white">
          <SheetHeader className="sr-only">
            <SheetTitle>Merchant navigation</SheetTitle>
          </SheetHeader>
          <MerchantSidebar onNavigate={handleNavigate} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#2D2825] truncate">
          Merchant Console
        </p>
        <p className="text-[11px] text-[#736B66] truncate hidden sm:block">
          จัดการคำสั่งซื้อ สินค้า และคู่ค้าทางธุรกิจในที่เดียว
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <NotificationBell />
      </div>
    </header>
  );
}
