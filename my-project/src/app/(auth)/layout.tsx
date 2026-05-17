import React from "react";
import { Package, CheckCircle2 } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

// Split-panel layout: left = brand panel (cream), right = form (white)
// Mobile: left panel ซ่อน, แสดงเฉพาะฝั่ง form
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-[#F5F0E8]">
      {/* Left brand panel — hidden on mobile */}
      <aside className="hidden lg:flex lg:w-2/5 relative overflow-hidden bg-[#F5F0E8] p-12 flex-col justify-between">
        {/* Decorative sand gradient blobs */}
        <div
          aria-hidden
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #D4A574 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #CC785C 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#CC785C] flex items-center justify-center shadow-sm">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-[#2D2825]">B2B Wholesale</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-[#2D2825] leading-tight">
              Run your wholesale<br />operation with clarity.
            </h2>
            <p className="text-[#736B66] text-base max-w-md">
              จัดการสินค้า คำสั่งซื้อ และ supply chain ในที่เดียว ออกแบบมาเพื่อ B2B
              merchant ที่ต้องการประสิทธิภาพและความแม่นยำ
            </p>
          </div>

          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#CC785C] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#2D2825]">Real-time inventory tracking</p>
                <p className="text-xs text-[#736B66]">รู้สต็อกทันที พร้อมแจ้งเตือนเมื่อใกล้หมด</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#CC785C] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#2D2825]">Automated PO workflow</p>
                <p className="text-xs text-[#736B66]">สั่งซื้อจาก supplier ได้อย่างเป็นระบบ</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#CC785C] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#2D2825]">Multi-vendor tiered pricing</p>
                <p className="text-xs text-[#736B66]">ตั้งราคาขั้นบันไดตาม customer tier ได้</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="relative z-10 text-xs text-[#736B66]">
          &copy; {new Date().getFullYear()} B2B Wholesale. All rights reserved.
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[#FFFFFF] lg:bg-[#F5F0E8]">
        {children}
      </main>
    </div>
  );
}
