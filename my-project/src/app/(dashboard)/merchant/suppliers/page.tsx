import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  ClipboardList,
  Package,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getSuppliers,
  getSupplierSummary,
} from "@/server/actions/suppliers";
import { SupplierTableClient } from "@/components/merchant/SupplierTableClient";
import { AddSupplierDialog } from "@/components/merchant/AddSupplierDialog";

export const dynamic = "force-dynamic";

export default async function MerchantSuppliersPage(): Promise<React.ReactElement> {
  const [suppliersRes, summaryRes] = await Promise.all([
    getSuppliers(),
    getSupplierSummary(),
  ]);

  const suppliers = suppliersRes.data ?? [];
  const summary =
    summaryRes.data ?? {
      activeSuppliers: 0,
      pendingPOs: 0,
      inTransitShipments: 0,
    };

  const loadError = suppliersRes.error ?? summaryRes.error;

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
            <Truck className="h-7 w-7 text-[#CC785C]" />
            Suppliers
          </h1>
          <p className="text-[#736B66] mt-1">
            จัดการ supplier และข้อมูลติดต่อสำหรับการจัดซื้อ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/merchant/purchase-orders">
            <Button
              variant="outline"
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
            >
              <ClipboardList className="mr-2 h-4 w-4 text-[#CC785C]" />
              Purchase Orders
            </Button>
          </Link>
          <AddSupplierDialog />
        </div>
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Active Suppliers
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {summary.activeSuppliers}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              พร้อมรับใบสั่งซื้อใหม่
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Pending POs
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#CC785C]">
              {summary.pendingPOs}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              Draft / Sent / Confirmed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              In Transit
            </CardTitle>
            <Package className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {summary.inTransitShipments}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              shipment กำลังจัดส่ง
            </p>
          </CardContent>
        </Card>
      </div>

      <SupplierTableClient suppliers={suppliers} />
    </div>
  );
}
