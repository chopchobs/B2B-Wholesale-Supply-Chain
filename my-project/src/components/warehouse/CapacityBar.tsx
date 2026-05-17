import * as React from "react";
import { cn } from "@/lib/utils";

interface CapacityBarProps {
  used: number;
  capacity: number;
  className?: string;
}

// แสดง progress bar การใช้พื้นที่จัดเก็บ
export function CapacityBar(props: CapacityBarProps): React.ReactElement {
  const { used, capacity, className } = props;

  // กัน div by zero และ negative
  const safeCapacity = capacity > 0 ? capacity : 1;
  const pct = Math.min(100, Math.max(0, (used / safeCapacity) * 100));

  // เลือกสีตามระดับการใช้งาน
  let fillClass = "bg-[#D4A574]";
  if (pct >= 90) fillClass = "bg-[#CC785C]";
  else if (pct >= 70) fillClass = "bg-[#D4A574]";

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-[#736B66]">Capacity utilization</span>
        <span className="font-semibold text-[#2D2825]">
          {used.toLocaleString()} / {capacity.toLocaleString()} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#E8E0D5] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", fillClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
