import {
  getKPISummary,
  getRevenueByDay,
  getTopProducts,
  getRecentOrders,
  getLowStockItems,
} from "@/lib/analytics";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { LowStockPanel } from "@/components/dashboard/LowStockPanel";
import { checkOverdueInvoices } from "@/server/actions/notifications";

export const dynamic = "force-dynamic";

// แสดงวันที่วันนี้ในรูปแบบยาว เช่น "Saturday, May 17, 2026"
function formatTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function MerchantDashboard() {
  // Phase 14: เช็คใบแจ้งหนี้ค้างชำระและสร้าง notifications ที่ยังไม่มี
  await checkOverdueInvoices();

  // Phase 22: โหลด analytics data ทั้งหมดแบบขนาน
  const [kpi, revenueSeries, topProducts, recentOrders, lowStock] = await Promise.all([
    getKPISummary(),
    getRevenueByDay(30),
    getTopProducts(5),
    getRecentOrders(10),
    getLowStockItems(6),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2D2825]">
            Dashboard
          </h1>
          <p className="text-[#736B66] mt-1.5 text-sm">{formatTodayLabel()}</p>
        </div>
      </div>

      {/* KPI Grid */}
      <KPIGrid data={kpi} />

      {/* Charts row: Revenue (2 cols) + Top Products (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueSeries} />
        </div>
        <div className="lg:col-span-1">
          <TopProductsChart data={topProducts} />
        </div>
      </div>

      {/* Tables row: Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrdersTable orders={recentOrders} />
        <LowStockPanel items={lowStock} />
      </div>
    </div>
  );
}
