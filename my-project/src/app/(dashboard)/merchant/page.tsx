import React from "react";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, Boxes, AlertTriangle } from "lucide-react";
import { OverviewChart } from "@/components/merchant/OverviewChart";
import { getInventorySummary } from "@/server/actions/inventory";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MerchantDashboard() {
  // 1. Fetch Total Orders
  const totalOrders = await prisma.order.count();

  // 2. Fetch Active Products
  const activeProducts = await prisma.product.count({
    where: { isActive: true },
  });

  // 3. Fetch Total Revenue (Exclude CANCELLED)
  const revenueAgg = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: { status: { not: "CANCELLED" } },
  });
  const totalRevenue = Number(revenueAgg._sum.totalAmount || 0);

  // 4. Fetch Inventory Summary (Phase 9)
  const inventorySummaryResult = await getInventorySummary();
  const inventorySummary = inventorySummaryResult.data ?? {
    totalSkus: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  // 5. Fetch 5 Recent Sales
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DELIVERED": return "success";
      case "CANCELLED": return "destructive";
      case "PENDING": return "warning";
      case "PROCESSING":
      case "SHIPPED":
      default: return "info";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your B2B wholesale performance and recent activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/merchant/inventory">
            <Button variant="outline" size="sm" className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]">
              <Boxes className="mr-2 h-4 w-4 text-[#CC785C]" />
              Manage Inventory
            </Button>
          </Link>
          <Link href="/merchant/products">
            <Button variant="outline" size="sm" className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]">
              <Package className="mr-2 h-4 w-4 text-[#D4A574]" />
              Products
            </Button>
          </Link>
          <Link href="/merchant/orders">
            <Button variant="outline" size="sm" className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]">
              <ShoppingCart className="mr-2 h-4 w-4 text-[#736B66]" />
              Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ฿{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Excludes cancelled orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime wholesale orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently listed in catalog</p>
          </CardContent>
        </Card>

        <Link href="/merchant/inventory" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory</CardTitle>
              {inventorySummary.lowStockCount + inventorySummary.outOfStockCount > 0 ? (
                <AlertTriangle className="h-4 w-4 text-[#CC785C]" />
              ) : (
                <Boxes className="h-4 w-4 text-[#D4A574]" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2D2825]">
                {inventorySummary.totalSkus}
                <span className="text-sm font-normal text-muted-foreground ml-1">SKUs</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {inventorySummary.lowStockCount + inventorySummary.outOfStockCount > 0 ? (
                  <span className="text-[#CC785C] font-medium">
                    {inventorySummary.lowStockCount + inventorySummary.outOfStockCount} need attention
                  </span>
                ) : (
                  "All stock levels healthy"
                )}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-7">
        {/* Chart Section */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Estimated sales performance over the week.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart />
          </CardContent>
        </Card>

        {/* Recent Orders Section */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Latest {recentOrders.length} wholesale orders.</CardDescription>
            </div>
            <Link href="/merchant/orders">
              <Button variant="outline" size="sm" className="text-xs">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No orders found.
              </div>
            ) : (
              <div className="space-y-6">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {order.user.name || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.user.email}
                      </p>
                      <div className="mt-1">
                        <Badge variant={getStatusBadgeVariant(order.status)} className="text-[10px] px-1.5 py-0">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-bold text-primary">
                        +฿{Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        #{order.id.substring(0, 6)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
