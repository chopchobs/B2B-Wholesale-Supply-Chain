import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RotateCcw,
  Clock,
  CheckCircle2,
  PackageCheck,
  Banknote,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getReturns,
  getReturnSummary,
  getReturnableOrders,
} from "@/server/actions/returns";
import { ReturnTableClient } from "@/components/merchant/ReturnTableClient";
import { CreateReturnDialog } from "@/components/merchant/CreateReturnDialog";

export const dynamic = "force-dynamic";

export default async function ReturnsListPage(): Promise<React.ReactElement> {
  const [returnsRes, summaryRes, returnableRes] = await Promise.all([
    getReturns(),
    getReturnSummary(),
    getReturnableOrders(),
  ]);

  const returns = returnsRes.data ?? [];
  const summary =
    summaryRes.data ?? {
      totalReturns: 0,
      pending: 0,
      approved: 0,
      received: 0,
      refunded: 0,
      totalRefundAmount: 0,
    };
  const returnableOrders = returnableRes.data ?? [];
  const loadError =
    returnsRes.error ?? summaryRes.error ?? returnableRes.error;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
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
            <RotateCcw className="h-7 w-7 text-[#CC785C]" />
            Returns &amp; Refunds
          </h1>
          <p className="text-[#736B66] mt-1">
            จัดการคำขอคืนสินค้า (RMA) และการคืนเงินทั้งหมด
          </p>
        </div>
        <CreateReturnDialog returnableOrders={returnableOrders} />
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Total Returns
            </CardTitle>
            <RotateCcw className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {summary.totalReturns}
            </div>
            <p className="text-xs text-[#736B66] mt-1">Lifetime RMAs</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#D4A574]">
              {summary.pending}
            </div>
            <p className="text-xs text-[#736B66] mt-1">รอตรวจสอบ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Approved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#CC785C]">
              {summary.approved}
            </div>
            <p className="text-xs text-[#736B66] mt-1">อนุมัติแล้ว รอรับของ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Received
            </CardTitle>
            <PackageCheck className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {summary.received}
            </div>
            <p className="text-xs text-[#736B66] mt-1">รับของแล้ว รอ refund</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Total Refunded
            </CardTitle>
            <Banknote className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              ฿
              {summary.totalRefundAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              คืนเงินรวม ({summary.refunded} รายการ)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* No returnable orders hint */}
      {returnableOrders.length === 0 && returns.length === 0 && (
        <Card className="bg-white border-[#E8E0D5]">
          <CardContent className="p-8 text-center space-y-3">
            <RotateCcw className="h-10 w-10 text-[#D4A574] mx-auto" />
            <div className="text-[#2D2825] font-medium">
              ยังไม่มีคำขอคืนสินค้า
            </div>
            <p className="text-sm text-[#736B66]">
              คำขอคืนจะสร้างได้จาก order ที่ถูกจัดส่งแล้ว (SHIPPED / DELIVERED)
            </p>
            <Link href="/merchant/orders">
              <Button
                variant="outline"
                className="border-[#E8E0D5] text-[#CC785C] hover:bg-[#F5F0E8]"
              >
                <Plus className="mr-2 h-4 w-4" />
                ดู Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {(returns.length > 0 || returnableOrders.length > 0) && (
        <ReturnTableClient returns={returns} />
      )}
    </div>
  );
}
