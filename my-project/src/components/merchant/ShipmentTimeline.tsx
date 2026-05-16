"use client";

import React from "react";
import {
  CheckCircle2,
  Package,
  Truck,
  AlertTriangle,
  Clock,
  Pin,
  MessageSquare,
  Building2,
  X,
} from "lucide-react";
import type { ShipmentEventType } from "@prisma/client";

import type { ShipmentEventItem } from "@/server/actions/shipments";

interface ShipmentTimelineProps {
  events: ShipmentEventItem[];
}

function getIcon(type: ShipmentEventType): React.ReactElement {
  switch (type) {
    case "CREATED":
      return <Package className="h-4 w-4 text-[#736B66]" />;
    case "PICKED_UP":
      return <Truck className="h-4 w-4 text-[#D4A574]" />;
    case "IN_TRANSIT":
      return <Truck className="h-4 w-4 text-[#CC785C]" />;
    case "ARRIVED_AT_HUB":
      return <Building2 className="h-4 w-4 text-[#CC785C]" />;
    case "OUT_FOR_DELIVERY":
      return <Pin className="h-4 w-4 text-[#CC785C]" />;
    case "DELIVERY_ATTEMPTED":
      return <Clock className="h-4 w-4 text-[#D4A574]" />;
    case "DELIVERED":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "FAILED":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "RETURNED":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "CANCELLED":
      return <X className="h-4 w-4 text-destructive" />;
    case "NOTE":
    default:
      return <MessageSquare className="h-4 w-4 text-[#736B66]" />;
  }
}

export function ShipmentTimeline({
  events,
}: ShipmentTimelineProps): React.ReactElement {
  if (events.length === 0) {
    return (
      <div className="text-sm text-[#736B66] text-center py-8">
        ยังไม่มีเหตุการณ์ในไทม์ไลน์
      </div>
    );
  }

  return (
    <ol className="relative border-l border-[#E8E0D5] ml-2 space-y-4">
      {events.map((e) => (
        <li key={e.id} className="ml-4">
          <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-white border border-[#E8E0D5]">
            {getIcon(e.type)}
          </span>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-sm text-[#2D2825] font-medium">
              {e.type.replace(/_/g, " ")}
            </div>
            <div className="text-xs text-[#736B66]">
              {new Date(e.occurredAt).toLocaleString()}
            </div>
          </div>
          <div className="text-sm text-[#2D2825] mt-1">{e.message}</div>
          {e.location && (
            <div className="text-xs text-[#736B66] mt-0.5 flex items-center gap-1">
              <Pin className="h-3 w-3" />
              {e.location}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
