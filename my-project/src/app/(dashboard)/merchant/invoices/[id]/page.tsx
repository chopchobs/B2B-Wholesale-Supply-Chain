import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getInvoiceById } from "@/server/actions/invoices";
import { InvoiceDetailClient } from "@/components/merchant/InvoiceDetailClient";

export const dynamic = "force-dynamic";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage(
  props: InvoiceDetailPageProps
): Promise<React.ReactElement> {
  const { id } = await props.params;
  const res = await getInvoiceById(id);

  if (res.error && !res.data) {
    // ถ้าไม่พบจริงๆ ให้ 404
    if (res.error === "Invoice not found.") {
      notFound();
    }
  }

  if (!res.data) {
    return (
      <div className="flex-1 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {res.error ?? "Invoice could not be loaded."}
        </div>
      </div>
    );
  }

  const invoice = res.data;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      <div className="flex items-center gap-2 print:hidden">
        <Link href="/merchant/invoices">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Invoices
          </Button>
        </Link>
      </div>

      <InvoiceDetailClient invoice={invoice} />
    </div>
  );
}
