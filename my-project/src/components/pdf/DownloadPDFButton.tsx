"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface DownloadPDFButtonProps {
  href: string;
  filename: string;
  label?: string;
}

export function DownloadPDFButton(
  props: DownloadPDFButtonProps
): React.ReactElement {
  const { href, filename, label } = props;
  const [loading, setLoading] = useState(false);

  // จัดการคลิก: เปิดในแท็บใหม่ + แสดง loading state สั้นๆ
  function handleClick(): void {
    setLoading(true);
    // เปิดในแท็บใหม่ — เบราว์เซอร์จะจัดการ download header เอง
    const w = window.open(href, "_blank", "noopener,noreferrer");
    // ถ้าบล็อก popup ให้ fallback เป็น location
    if (!w) {
      window.location.href = href;
    }
    // ปลดล็อก loading หลังครู่หนึ่ง
    window.setTimeout(function resetLoading() {
      setLoading(false);
    }, 1200);
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading}
      size="sm"
      className="bg-[#CC785C] hover:bg-[#B86548] text-white"
      title={`Download ${filename}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {label ?? "Download PDF"}
    </Button>
  );
}
