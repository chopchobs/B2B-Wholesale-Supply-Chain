"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { TopProduct } from "@/lib/analytics";

interface TopProductsChartProps {
  data: TopProduct[];
}

// ตัดชื่อสินค้าให้สั้นเพื่อแสดงในแกน
function truncate(name: string, max = 20): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

function formatAxisRevenue(value: number): string {
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `฿${Math.round(value / 1000)}k`;
  return `฿${value}`;
}

interface TooltipPayloadItem {
  value: number;
  payload: TopProduct;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md bg-white border border-[#E8E0D5] shadow-md px-3 py-2 text-xs">
      <div className="text-[#2D2825] font-semibold mb-1">{p.name}</div>
      <div className="text-[#736B66]">
        Revenue:{" "}
        <span className="text-[#2D2825] font-medium">
          ฿{p.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
      </div>
      <div className="text-[#736B66]">
        Units sold: <span className="text-[#2D2825] font-medium">{p.unitsSold}</span>
      </div>
    </div>
  );
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // เตรียมข้อมูลพร้อมชื่อย่อสำหรับแกน
  const chartData = data.map((d) => ({ ...d, shortName: truncate(d.name, 20) }));

  return (
    <div className="rounded-lg bg-white border border-[#E8E0D5] shadow-sm p-5 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#2D2825]">
          Top Products by Revenue
        </h2>
        <p className="text-xs text-[#736B66] mt-0.5">All-time leaders</p>
      </div>

      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[#736B66] min-h-[260px]">
          No product sales yet.
        </div>
      ) : (
        <div className="flex-1 min-h-[260px]">
          <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 36)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
            >
              <CartesianGrid stroke="#E8E0D5" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={formatAxisRevenue}
                stroke="#736B66"
                tick={{ fontSize: 11, fill: "#736B66" }}
                tickLine={false}
                axisLine={{ stroke: "#E8E0D5" }}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                stroke="#736B66"
                tick={{ fontSize: 11, fill: "#2D2825" }}
                tickLine={false}
                axisLine={{ stroke: "#E8E0D5" }}
                width={140}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#F5F0E8" }}
              />
              <Bar
                dataKey="revenue"
                radius={[0, 4, 4, 0]}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((_, idx) => (
                  <Cell
                    key={`bar-${idx}`}
                    fill={activeIndex === idx ? "#CC785C" : "#D4A574"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
