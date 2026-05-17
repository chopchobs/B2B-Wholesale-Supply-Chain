"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { RevenuePoint } from "@/lib/analytics";

interface RevenueChartProps {
  data: RevenuePoint[];
}

// แปลง YYYY-MM-DD → "May 1"
function formatTickDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map((s) => Number(s));
  if (!y || !m || !d) return dateStr;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatRevenueAxis(value: number): string {
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `฿${Math.round(value / 1000)}k`;
  return `฿${value}`;
}

interface TooltipPayloadItem {
  value: number;
  payload: RevenuePoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-md bg-white border border-[#E8E0D5] shadow-md px-3 py-2 text-xs">
      <div className="text-[#736B66] mb-1">{label ? formatTickDate(label) : ""}</div>
      <div className="text-[#2D2825] font-semibold">
        ฿{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <div className="rounded-lg bg-white border border-[#E8E0D5] shadow-sm p-5 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#2D2825]">
          Revenue — Last 30 Days
        </h2>
        <p className="text-xs text-[#736B66] mt-0.5">
          Daily revenue from confirmed orders
        </p>
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[#736B66] min-h-[260px]">
          No revenue data for the selected period.
        </div>
      ) : (
        <div className="flex-1 min-h-[260px]">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
            >
              <CartesianGrid stroke="#E8E0D5" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatTickDate}
                stroke="#736B66"
                tick={{ fontSize: 11, fill: "#736B66" }}
                tickLine={false}
                axisLine={{ stroke: "#E8E0D5" }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tickFormatter={formatRevenueAxis}
                stroke="#736B66"
                tick={{ fontSize: 11, fill: "#736B66" }}
                tickLine={false}
                axisLine={{ stroke: "#E8E0D5" }}
                width={56}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#D4A574", strokeWidth: 1, strokeDasharray: "3 3" }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#CC785C"
                strokeWidth={2}
                dot={{ r: 3, fill: "#CC785C", stroke: "#CC785C" }}
                activeDot={{ r: 5, fill: "#CC785C", stroke: "#FFFFFF", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
