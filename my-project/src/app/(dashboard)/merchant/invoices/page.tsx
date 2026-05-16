import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  CircleDollarSign,
  AlertTriangle,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { InvoiceStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getInvoices,
  getInvoiceSummary,
} from "@/server/actions/invoices";
import { InvoiceTableClient } from "@/components/merchant/InvoiceTableClient";

export const dynamic = "force-dynamic";

interface InvoicesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type FilterValue = "ALL" | InvoiceStatus;

function parseFilter(value: string | undefined): FilterValue {
  if (
    value === "DRAFT" ||
    value === "SENT" ||
    value === "PAID" ||
    value === "OVERDUE" ||
    value === "CANCELLED"
  ) {
    return value;
  }
  return "ALL";
}

function fmtTHB(n: number): string {
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default async function MerchantInvoicesPage(
  props: InvoicesPageProps
): Promise<React.ReactElement> {
  const params = await props.searchParams;
  const filter = parseFilter(
    typeof params.status === "string" ? params.status : undefined
  );

  const [invoicesRes, summaryRes] = await Promise.all([
    getInvoices(),
    getInvoiceSummary(),
  ]);

  const invoices = invoicesRes.data ?? [];
  const summary =
    summaryRes.data ?? {
      totalOutstanding: 0,
      totalPaidThisMonth: 0,
      overdueCount: 0,
      draftCount: 0,
      sentCount: 0,
      paidCount: 0,
    };

  const loadError = invoicesRes.error ?? summaryRes.error;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/merchant">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
            <FileText className="h-7 w-7 text-[#CC785C]" />
            Invoices & Billing
          </h1>
          <p className="text-[#736B66] mt-1">
            จัดการใบแจ้งหนี้ บันทึกการชำระเงิน และติดตามยอดค้างชำระ
          </p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Total Outstanding
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#CC785C]">
              {fmtTHB(summary.totalOutstanding)}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              SENT + OVERDUE ยังไม่ชำระ
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Paid This Month
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {fmtTHB(summary.totalPaidThisMonth)}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              {summary.paidCount} invoices paid (all time)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summary.overdueCount}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              ต้องติดตามการชำระทันที
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Draft
            </CardTitle>
            <Pencil className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {summary.draftCount}
            </div>
            <p className="text-xs text-[#736B66] mt-1">รอ Mark as Sent</p>
          </CardContent>
        </Card>
      </div>

      <InvoiceTableClient invoices={invoices} initialFilter={filter} />
    </div>
  );
}
