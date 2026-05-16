import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCustomers,
  getCustomerSummary,
} from "@/server/actions/customers";
import { CustomerTableClient } from "@/components/merchant/CustomerTableClient";

export const dynamic = "force-dynamic";

function formatTHB(n: number): string {
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default async function MerchantCustomersPage(): Promise<React.ReactElement> {
  const [customersRes, summaryRes] = await Promise.all([
    getCustomers(),
    getCustomerSummary(),
  ]);

  const customers = customersRes.data ?? [];
  const summary =
    summaryRes.data ?? {
      totalCustomers: 0,
      activeCustomers: 0,
      suspendedCustomers: 0,
      totalCreditOutstanding: 0,
    };

  const loadError = customersRes.error ?? summaryRes.error;

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
            <Users className="h-7 w-7 text-[#CC785C]" />
            Customers
          </h1>
          <p className="text-[#736B66] mt-1">
            จัดการลูกค้า B2B, credit limit และ account tier
          </p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {summary.totalCustomers}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              จำนวนลูกค้าทั้งหมดในระบบ
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Active
            </CardTitle>
            <UserCheck className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#CC785C]">
              {summary.activeCustomers}
            </div>
            <p className="text-xs text-[#736B66] mt-1">พร้อมสั่งซื้อ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Suspended
            </CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {summary.suspendedCustomers}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              ถูกระงับการใช้งานชั่วคราว
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Credit Outstanding
            </CardTitle>
            <Wallet className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#CC785C]">
              {formatTHB(summary.totalCreditOutstanding)}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              ยอด credit ที่ยังไม่ชำระ
            </p>
          </CardContent>
        </Card>
      </div>

      <CustomerTableClient customers={customers} />
    </div>
  );
}
