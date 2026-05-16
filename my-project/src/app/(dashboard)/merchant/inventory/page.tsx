import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Package, Boxes } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getInventoryItems,
  getInventorySummary,
} from "@/server/actions/inventory";
import { InventoryTableClient } from "@/components/merchant/InventoryTableClient";

export const dynamic = "force-dynamic";

export default async function MerchantInventoryPage() {
  const [itemsResult, summaryResult] = await Promise.all([
    getInventoryItems(),
    getInventorySummary(),
  ]);

  const items = itemsResult.data ?? [];
  const summary = summaryResult.data ?? {
    totalSkus: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  const criticalCount = summary.lowStockCount + summary.outOfStockCount;
  const loadError = itemsResult.error ?? summaryResult.error;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      {/* Breadcrumb / Back */}
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
            <Boxes className="h-7 w-7 text-[#CC785C]" />
            Inventory Management
          </h1>
          <p className="text-[#736B66] mt-1">
            ติดตามสต็อก เติมสินค้า และปรับยอดคงเหลือทั้งหมดในที่เดียว
          </p>
        </div>
      </div>

      {/* Low Stock Banner */}
      {criticalCount > 0 && (
        <div className="rounded-xl border border-[#CC785C]/40 bg-[#CC785C]/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[#CC785C] mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-[#2D2825]">
              Stock Alert: {criticalCount} item
              {criticalCount > 1 ? "s" : ""} need
              {criticalCount > 1 ? "" : "s"} attention
            </p>
            <p className="text-sm text-[#736B66] mt-0.5">
              {summary.outOfStockCount > 0 && (
                <span className="mr-3">
                  หมดสต็อก:{" "}
                  <span className="font-semibold text-destructive">
                    {summary.outOfStockCount}
                  </span>
                </span>
              )}
              {summary.lowStockCount > 0 && (
                <span>
                  ใกล้หมด:{" "}
                  <span className="font-semibold text-[#CC785C]">
                    {summary.lowStockCount}
                  </span>
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#2D2825]">
              Total SKUs
            </CardTitle>
            <Package className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {summary.totalSkus.toLocaleString()}
            </div>
            <p className="text-xs text-[#736B66] mt-1">Active inventory items</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#2D2825]">
              Low Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#CC785C]">
              {summary.lowStockCount.toLocaleString()}
            </div>
            <p className="text-xs text-[#736B66] mt-1">Below threshold</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#2D2825]">
              Out of Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summary.outOfStockCount.toLocaleString()}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              ต้องเติมสต็อกโดยด่วน
            </p>
          </CardContent>
        </Card>
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      {/* Table + Actions */}
      <InventoryTableClient items={items} />
    </div>
  );
}
