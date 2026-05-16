import React from "react";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, Boxes, AlertTriangle, BarChart3, FileText, Truck, ClipboardList, Users, UsersRound, Settings as SettingsIcon } from "lucide-react";
import { OverviewChart } from "@/components/merchant/OverviewChart";
import { getInventorySummary } from "@/server/actions/inventory";
import { getInvoiceSummary } from "@/server/actions/invoices";
import { getSupplierSummary } from "@/server/actions/suppliers";
import { getCustomerSummary } from "@/server/actions/customers";
import { getUserSummary } from "@/server/actions/users";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/merchant/NotificationBell";
import { checkOverdueInvoices } from "@/server/actions/notifications";
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
  // Phase 14: เช็คใบแจ้งหนี้ค้างชำระและสร้าง notifications ที่ยังไม่มี
  await checkOverdueInvoices();

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

  // 4b. Fetch Invoice Summary (Phase 11)
  const invoiceSummaryResult = await getInvoiceSummary();
  const invoiceSummary = invoiceSummaryResult.data ?? {
    totalOutstanding: 0,
    totalPaidThisMonth: 0,
    overdueCount: 0,
    draftCount: 0,
    sentCount: 0,
    paidCount: 0,
  };

  // 4c. Fetch Supplier Summary (Phase 12)
  const supplierSummaryResult = await getSupplierSummary();
  const supplierSummary = supplierSummaryResult.data ?? {
    activeSuppliers: 0,
    pendingPOs: 0,
    inTransitShipments: 0,
  };

  // 4d. Fetch Customer Summary (Phase 13)
  const customerSummaryResult = await getCustomerSummary();
  const customerSummary = customerSummaryResult.data ?? {
    totalCustomers: 0,
    activeCustomers: 0,
    suspendedCustomers: 0,
    totalCreditOutstanding: 0,
  };

  // 4e. Fetch User Summary (Phase 15)
  const userSummaryResult = await getUserSummary();
  const userSummary = userSummaryResult.data ?? {
    totalUsers: 0,
    admins: 0,
    merchants: 0,
    vipClients: 0,
    buyers: 0,
    pendingApprovals: 0,
    suspendedUsers: 0,
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
          <NotificationBell />
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
          <Link href="/merchant/invoices">
            <Button variant="outline" size="sm" className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]">
              <FileText className="mr-2 h-4 w-4 text-[#CC785C]" />
              Invoices
            </Button>
          </Link>
          <Link href="/merchant/customers">
            <Button variant="outline" size="sm" className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]">
              <Users className="mr-2 h-4 w-4 text-[#CC785C]" />
              Customers
            </Button>
          </Link>
          <Link href="/merchant/users">
            <Button variant="outline" size="sm" className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8] relative">
              <UsersRound className="mr-2 h-4 w-4 text-[#CC785C]" />
              Users
              {userSummary.pendingApprovals > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-[#CC785C] text-white px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                  {userSummary.pendingApprovals}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/merchant/suppliers">
            <Button variant="outline" size="sm" className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]">
              <Truck className="mr-2 h-4 w-4 text-[#CC785C]" />
              Suppliers
            </Button>
          </Link>
          <Link href="/merchant/purchase-orders">
            <Button variant="outline" size="sm" className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]">
              <ClipboardList className="mr-2 h-4 w-4 text-[#D4A574]" />
              Purchase Orders
            </Button>
          </Link>
          <Link href="/merchant/shipping">
            <Button variant="outline" size="sm" className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]">
              <Truck className="mr-2 h-4 w-4 text-[#D4A574]" />
              Shipping
            </Button>
          </Link>
          <Link href="/merchant/reports">
            <Button variant="outline" size="sm" className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]">
              <BarChart3 className="mr-2 h-4 w-4 text-[#CC785C]" />
              Reports
            </Button>
          </Link>
          <Link href="/merchant/settings">
            <Button variant="outline" size="sm" className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]">
              <SettingsIcon className="mr-2 h-4 w-4 text-[#736B66]" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {userSummary.pendingApprovals > 0 && (
        <Link href="/merchant/users/approvals" className="block">
          <div className="rounded-md p-4 bg-[#CC785C]/10 border border-[#CC785C]/40 flex items-center justify-between hover:bg-[#CC785C]/15 transition-colors">
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="h-5 w-5 text-[#CC785C]" />
              <span className="text-[#2D2825] font-medium">
                มีคำขออนุมัติ user ใหม่{" "}
                <span className="text-[#CC785C] font-bold">
                  {userSummary.pendingApprovals}
                </span>{" "}
                รายการที่รอดำเนินการ
              </span>
            </div>
            <span className="text-xs text-[#CC785C] font-semibold">
              ดู approval queue →
            </span>
          </div>
        </Link>
      )}

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
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

        <Link href="/merchant/invoices" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invoices</CardTitle>
              {invoiceSummary.overdueCount > 0 ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <FileText className="h-4 w-4 text-[#CC785C]" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#CC785C]">
                ฿{invoiceSummary.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {invoiceSummary.overdueCount > 0 ? (
                  <span className="text-destructive font-medium">
                    {invoiceSummary.overdueCount} overdue · outstanding total
                  </span>
                ) : (
                  "Outstanding balance"
                )}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/merchant/customers" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-[#CC785C]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2D2825]">
                {customerSummary.activeCustomers}
                <span className="text-sm font-normal text-muted-foreground ml-1">active</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {customerSummary.totalCreditOutstanding > 0 ? (
                  <span className="text-[#CC785C] font-medium">
                    ฿{customerSummary.totalCreditOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })} credit outstanding
                  </span>
                ) : (
                  "No outstanding credit"
                )}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/merchant/suppliers" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
              <Truck className="h-4 w-4 text-[#CC785C]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2D2825]">
                {supplierSummary.activeSuppliers}
                <span className="text-sm font-normal text-muted-foreground ml-1">active</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {supplierSummary.pendingPOs > 0 ? (
                  <span className="text-[#CC785C] font-medium">
                    {supplierSummary.pendingPOs} pending POs
                  </span>
                ) : (
                  "No pending purchase orders"
                )}
              </p>
            </CardContent>
          </Card>
        </Link>

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
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Estimated sales performance over the week.</CardDescription>
            </div>
            <Link href="/merchant/reports">
              <Button variant="outline" size="sm" className="text-xs border-[#E8E0D5] text-[#CC785C] hover:bg-[#F5F0E8]">
                View Full Reports →
              </Button>
            </Link>
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
