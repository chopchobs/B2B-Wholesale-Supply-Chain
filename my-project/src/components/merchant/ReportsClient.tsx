"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Download,
  Boxes,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { RevenueTrendChart } from "@/components/merchant/RevenueTrendChart";
import { OrderStatusChart } from "@/components/merchant/OrderStatusChart";
import type {
  InventoryReport,
  OrderStatusBreakdownRow,
  ReportPeriod,
  RevenueTrendPoint,
  SalesReportSummary,
  TopCustomerRow,
  TopProductRow,
} from "@/server/actions/reports";

export type RangePreset = "7d" | "30d" | "90d" | "all";

interface ReportsClientProps {
  range: RangePreset;
  period: ReportPeriod;
  sales: SalesReportSummary;
  trend: RevenueTrendPoint[];
  statuses: OrderStatusBreakdownRow[];
  topProducts: TopProductRow[];
  inventory: InventoryReport;
  topCustomers: TopCustomerRow[];
  activeProducts: number;
}

// แปลงค่าเป็นเงิน ฿
function formatCurrency(value: number): string {
  return `฿${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// สร้างไฟล์ CSV และ trigger download ฝั่ง client
function downloadCsv(filename: string, rows: Array<Record<string, unknown>>): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? "" : String(v);
    if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ReportsClient(props: ReportsClientProps): React.ReactElement {
  const {
    range,
    period,
    sales,
    trend,
    statuses,
    topProducts,
    inventory,
    topCustomers,
    activeProducts,
  } = props;

  const router = useRouter();
  const searchParams = useSearchParams();

  // อัปเดต URL params โดยคงค่าอื่นๆ ไว้
  function updateParam(key: string, value: string): void {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set(key, value);
    router.push(`/merchant/reports?${params.toString()}`);
  }

  function handleExportTopProducts(): void {
    downloadCsv(
      `top-products-${range}.csv`,
      topProducts.map((p, idx) => ({
        rank: idx + 1,
        sku: p.sku,
        product: p.name,
        units_sold: p.unitsSold,
        revenue: p.revenue.toFixed(2),
      }))
    );
  }

  function handleExportCustomers(): void {
    downloadCsv(
      `top-customers-${range}.csv`,
      topCustomers.map((c, idx) => ({
        rank: idx + 1,
        name: c.name ?? "",
        email: c.email,
        order_count: c.orderCount,
        total_spend: c.totalSpend.toFixed(2),
      }))
    );
  }

  function handleExportRevenueTrend(): void {
    downloadCsv(
      `revenue-trend-${period}-${range}.csv`,
      trend.map((t) => ({ period: t.period, revenue: t.revenue.toFixed(2) }))
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-white border-[#E8E0D5]">
        <CardContent className="flex flex-wrap items-end justify-between gap-4 pt-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#736B66] uppercase tracking-wide">
              Date Range
            </p>
            <Select value={range} onValueChange={(v) => updateParam("range", v)}>
              <SelectTrigger className="w-[180px] bg-white border-[#E8E0D5] text-[#2D2825]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-[#736B66] uppercase tracking-wide">
              Trend Granularity
            </p>
            <Select
              value={period}
              onValueChange={(v) => updateParam("period", v)}
            >
              <SelectTrigger className="w-[180px] bg-white border-[#E8E0D5] text-[#2D2825]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#2D2825]">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {formatCurrency(sales.totalRevenue)}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              Excludes cancelled orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#2D2825]">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {sales.totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              Within the selected range
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#2D2825]">
              Avg Order Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {formatCurrency(sales.avgOrderValue)}
            </div>
            <p className="text-xs text-[#736B66] mt-1">Per completed order</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#2D2825]">
              Active Products
            </CardTitle>
            <Package className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {activeProducts.toLocaleString()}
            </div>
            <p className="text-xs text-[#736B66] mt-1">Currently listed</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="bg-white border-[#E8E0D5] lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[#2D2825]">Revenue Trend</CardTitle>
              <CardDescription className="text-[#736B66]">
                Revenue grouped by {period}.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportRevenueTrend}
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
            >
              <Download className="h-4 w-4 mr-2 text-[#CC785C]" />
              CSV
            </Button>
          </CardHeader>
          <CardContent>
            <RevenueTrendChart data={trend} />
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5] lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-[#2D2825]">Order Status</CardTitle>
            <CardDescription className="text-[#736B66]">
              Distribution of orders by current status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderStatusChart data={statuses} />
          </CardContent>
        </Card>
      </div>

      {/* Top Products + Inventory Health */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="bg-white border-[#E8E0D5] lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[#2D2825]">Top Products</CardTitle>
              <CardDescription className="text-[#736B66]">
                Best sellers by revenue.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportTopProducts}
              disabled={topProducts.length === 0}
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
            >
              <Download className="h-4 w-4 mr-2 text-[#CC785C]" />
              CSV
            </Button>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#736B66]">
                No product sales in this range.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E8E0D5]">
                    <TableHead className="w-[60px] text-[#736B66]">#</TableHead>
                    <TableHead className="text-[#736B66]">Product</TableHead>
                    <TableHead className="text-[#736B66]">SKU</TableHead>
                    <TableHead className="text-right text-[#736B66]">
                      Units
                    </TableHead>
                    <TableHead className="text-right text-[#736B66]">
                      Revenue
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p, idx) => (
                    <TableRow key={p.productId} className="border-[#E8E0D5]">
                      <TableCell className="font-mono text-[#736B66]">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-[#2D2825]">
                        {p.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-[#736B66]">
                        {p.sku}
                      </TableCell>
                      <TableCell className="text-right text-[#2D2825]">
                        {p.unitsSold.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#CC785C]">
                        {formatCurrency(p.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5] lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-[#2D2825]">Inventory Health</CardTitle>
            <CardDescription className="text-[#736B66]">
              สรุปสุขภาพคลังสินค้าปัจจุบัน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-[#D4A574]" />
                <span className="text-sm text-[#2D2825]">Total SKUs</span>
              </div>
              <span className="font-bold text-[#2D2825]">
                {inventory.totalSkus.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#CC785C]" />
                <span className="text-sm text-[#2D2825]">Low Stock</span>
              </div>
              <span className="font-bold text-[#CC785C]">
                {inventory.lowStockCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-[#2D2825]">Out of Stock</span>
              </div>
              <span className="font-bold text-destructive">
                {inventory.outOfStockCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#CC785C]" />
                <span className="text-sm text-[#2D2825]">
                  Estimated Stock Value
                </span>
              </div>
              <span className="font-bold text-[#2D2825]">
                {formatCurrency(inventory.estimatedStockValue)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[#2D2825]">Top Customers</CardTitle>
            <CardDescription className="text-[#736B66]">
              Ranked by total spend within the selected range.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCustomers}
            disabled={topCustomers.length === 0}
            className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
          >
            <Download className="h-4 w-4 mr-2 text-[#CC785C]" />
            CSV
          </Button>
        </CardHeader>
        <CardContent>
          {topCustomers.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#736B66]">
              No customer activity in this range.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#E8E0D5]">
                  <TableHead className="w-[60px] text-[#736B66]">#</TableHead>
                  <TableHead className="text-[#736B66]">Customer</TableHead>
                  <TableHead className="text-[#736B66]">Email</TableHead>
                  <TableHead className="text-right text-[#736B66]">
                    Orders
                  </TableHead>
                  <TableHead className="text-right text-[#736B66]">
                    Total Spend
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((c, idx) => (
                  <TableRow key={c.userId} className="border-[#E8E0D5]">
                    <TableCell className="font-mono text-[#736B66]">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium text-[#2D2825]">
                      {c.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-[#736B66] text-sm">
                      {c.email}
                    </TableCell>
                    <TableCell className="text-right text-[#2D2825]">
                      {c.orderCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#CC785C]">
                      {formatCurrency(c.totalSpend)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
