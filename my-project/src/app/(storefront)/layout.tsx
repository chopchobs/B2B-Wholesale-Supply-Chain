import * as React from "react";
import { StorefrontNav } from "@/components/storefront/StorefrontNav";

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

export default function StorefrontLayout({
  children,
}: StorefrontLayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#2D2825]">
      <StorefrontNav />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
