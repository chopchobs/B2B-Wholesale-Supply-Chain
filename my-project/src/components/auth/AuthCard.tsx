import React from "react";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// White surface card ใช้ครอบฟอร์มในหน้า auth ทุกหน้า
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E8E0D5] rounded-2xl shadow-sm">
      <div className="p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[#2D2825]">{title}</h1>
          {description ? (
            <p className="text-sm text-[#736B66]">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
      {footer ? (
        <div className="px-8 py-5 border-t border-[#E8E0D5] text-center text-sm text-[#736B66]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
