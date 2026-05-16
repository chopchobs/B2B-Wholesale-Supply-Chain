"use client";

import React from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { OrderStatusBreakdownRow } from "@/server/actions/reports";

interface OrderStatusChartProps {
  data: OrderStatusBreakdownRow[];
}

// Mapping สีตาม palette
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#D4A574",
  PROCESSING: "#CC785C",
  SHIPPED: "#B86548",
  DELIVERED: "#2D2825",
  CANCELLED: "#736B66",
};

export function OrderStatusChart(
  props: OrderStatusChartProps
): React.ReactElement {
  const { data } = props;

  const filtered = data.filter((d) => d.count > 0);
  const total = filtered.reduce((acc, d) => acc + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-[#736B66]">
        No orders to display.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="count"
          nameKey="status"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={2}
          stroke="#FFFFFF"
        >
          {filtered.map((entry) => (
            <Cell
              key={entry.status}
              fill={STATUS_COLORS[entry.status] ?? "#D4A574"}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #E8E0D5",
            background: "#FFFFFF",
            color: "#2D2825",
          }}
          formatter={(value: unknown, name: unknown) => [
            `${Number(value).toLocaleString()} orders`,
            String(name),
          ] as [string, string]}
        />
        <Legend
          verticalAlign="bottom"
          height={32}
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: "#2D2825" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
