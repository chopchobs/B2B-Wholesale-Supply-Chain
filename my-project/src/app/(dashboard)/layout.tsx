import * as React from "react";
import { MerchantSidebar } from "@/components/merchant/MerchantSidebar";
import { MerchantTopBar } from "@/components/merchant/MerchantTopBar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps): React.ReactElement {
  return (
    <div className="flex min-h-screen w-full bg-[#F5F0E8] text-[#2D2825]">
      {/* Desktop sidebar — fixed width, hidden on mobile */}
      <div className="hidden lg:flex lg:w-64 xl:w-72 shrink-0">
        <MerchantSidebar />
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <MerchantTopBar />
        <main className="min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
