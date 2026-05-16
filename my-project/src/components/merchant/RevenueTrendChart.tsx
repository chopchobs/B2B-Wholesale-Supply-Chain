"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenueTrendPoint } from "@/server/actions/reports";

interface RevenueTrendChartProps {
  data: RevenueTrendPoint[];
}

export function RevenueTrendChart(props: RevenueTrendChartProps): React.ReactElement {
  const { data } = props;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-sm text-[#736B66]">
        No revenue data in the selected range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#CC785C" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#CC785C" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E0D5" />
        <XAxis
          dataKey="period"
          stroke="#736B66"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dy={8}
        />
        <YAxis
          stroke="#736B66"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `฿${Number(v).toLocaleString()}`}
        />
        <Tooltip
          cursor={{ stroke: "#CC785C", strokeWidth: 1 }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #E8E0D5",
            background: "#FFFFFF",
            color: "#2D2825",
          }}
          formatter={(value: unknown) => [
            `฿${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            "Revenue",
          ] as [string, string]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#CC785C"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
