import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import type { KPISummary } from "@/lib/analytics";

interface KPIGridProps {
  data: KPISummary;
}

interface KPICardProps {
  label: string;
  value: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
  warning?: boolean;
}

function KPICard({ label, value, hint, Icon, warning = false }: KPICardProps) {
  return (
    <div className="rounded-lg bg-white border border-[#E8E0D5] shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#736B66] uppercase tracking-wide">
          {label}
        </span>
        <Icon
          className={`h-4 w-4 ${warning ? "text-[#CC785C]" : "text-[#D4A574]"}`}
        />
      </div>
      <div
        className={`text-xl font-bold ${
          warning ? "text-[#CC785C]" : "text-[#2D2825]"
        }`}
      >
        {value}
      </div>
      <p className="text-[11px] text-[#736B66] leading-tight">{hint}</p>
    </div>
  );
}

function formatCurrency(value: number): string {
  return `฿${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function KPIGrid({ data }: KPIGridProps) {
  const lowStockWarning = data.lowStockCount > 0;
  const pendingReturnsWarning = data.pendingReturns > 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard
        label="Total Revenue"
        value={formatCurrency(data.totalRevenue)}
        hint="This month, excl. cancelled"
        Icon={DollarSign}
      />
      <KPICard
        label="Orders"
        value={data.totalOrders.toLocaleString()}
        hint="This month"
        Icon={ShoppingCart}
      />
      <KPICard
        label="Avg Order Value"
        value={formatCurrency(data.avgOrderValue)}
        hint="Revenue / orders"
        Icon={TrendingUp}
      />
      <KPICard
        label="Active Customers"
        value={data.activeCustomers.toLocaleString()}
        hint="Distinct buyers this month"
        Icon={Users}
      />
      <KPICard
        label="Low Stock"
        value={data.lowStockCount.toLocaleString()}
        hint={lowStockWarning ? "Needs reorder" : "All healthy"}
        Icon={AlertTriangle}
        warning={lowStockWarning}
      />
      <KPICard
        label="Pending Returns"
        value={data.pendingReturns.toLocaleString()}
        hint={pendingReturnsWarning ? "Awaiting review" : "Nothing pending"}
        Icon={RotateCcw}
        warning={pendingReturnsWarning}
      />
    </div>
  );
}
