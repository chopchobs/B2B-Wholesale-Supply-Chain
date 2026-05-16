import React from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Boxes, Package, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import {
  getCustomerReport,
  getInventoryReport,
  getOrderStatusBreakdown,
  getRevenueByPeriod,
  getSalesReport,
  getTopProducts,
  type ReportPeriod,
} from "@/server/actions/reports";
import {
  ReportsClient,
  type RangePreset,
} from "@/components/merchant/ReportsClient";

export const dynamic = "force-dynamic";

interface ReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Normalize range preset
function parseRange(value: string | undefined): RangePreset {
  if (value === "7d" || value === "30d" || value === "90d" || value === "all") {
    return value;
  }
  return "30d";
}

function parsePeriod(value: string | undefined): ReportPeriod {
  if (value === "daily" || value === "weekly" || value === "monthly") {
    return value;
  }
  return "daily";
}

// แปลง preset เป็นช่วงวันที่จริง
function resolveDateRange(preset: RangePreset): { from?: Date; to?: Date } {
  if (preset === "all") return {};
  const now = new Date();
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const from = new Date(now);
  from.setDate(now.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from, to: now };
}

export default async function MerchantReportsPage(
  props: ReportsPageProps
): Promise<React.ReactElement> {
  const params = await props.searchParams;
  const rawRange = typeof params.range === "string" ? params.range : undefined;
  const rawPeriod =
    typeof params.period === "string" ? params.period : undefined;

  const range = parseRange(rawRange);
  const period = parsePeriod(rawPeriod);
  const dateRange = resolveDateRange(range);

  // ดึงข้อมูลทั้งหมดแบบขนานเพื่อความเร็ว
  const [
    salesResult,
    trendResult,
    statusResult,
    productsResult,
    inventoryResult,
    customersResult,
    activeProducts,
  ] = await Promise.all([
    getSalesReport(dateRange, period),
    getRevenueByPeriod(period, dateRange),
    getOrderStatusBreakdown(dateRange),
    getTopProducts(10, dateRange),
    getInventoryReport(),
    getCustomerReport(10, dateRange),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  const sales = salesResult.data ?? {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    rows: [],
  };
  const trend = trendResult.data ?? [];
  const statuses = statusResult.data ?? [];
  const topProducts = productsResult.data ?? [];
  const inventory = inventoryResult.data ?? {
    totalSkus: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    estimatedStockValue: 0,
  };
  const topCustomers = customersResult.data ?? [];

  const loadError =
    salesResult.error ??
    trendResult.error ??
    statusResult.error ??
    productsResult.error ??
    inventoryResult.error ??
    customersResult.error;

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

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-[#CC785C]" />
            Reports & Analytics
          </h1>
          <p className="text-[#736B66] mt-1">
            ภาพรวมยอดขาย สินค้าขายดี และสุขภาพของคลังสินค้าทั้งหมด
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/merchant/inventory">
            <Button
              variant="outline"
              size="sm"
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
            >
              <Boxes className="mr-2 h-4 w-4 text-[#CC785C]" />
              Inventory
            </Button>
          </Link>
          <Link href="/merchant/products">
            <Button
              variant="outline"
              size="sm"
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
            >
              <Package className="mr-2 h-4 w-4 text-[#D4A574]" />
              Products
            </Button>
          </Link>
          <Link href="/merchant/orders">
            <Button
              variant="outline"
              size="sm"
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
            >
              <ShoppingCart className="mr-2 h-4 w-4 text-[#736B66]" />
              Orders
            </Button>
          </Link>
        </div>
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      <ReportsClient
        range={range}
        period={period}
        sales={sales}
        trend={trend}
        statuses={statuses}
        topProducts={topProducts}
        inventory={inventory}
        topCustomers={topCustomers}
        activeProducts={activeProducts}
      />
    </div>
  );
}
