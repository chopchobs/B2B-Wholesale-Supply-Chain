"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ShipmentStatus } from "@prisma/client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateShipmentStatus } from "@/server/actions/shipments";

interface ShipmentStatusUpdaterProps {
  shipmentId: string;
  currentStatus: ShipmentStatus;
}

const STATUSES: { value: ShipmentStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "READY_TO_SHIP", label: "Ready to Ship" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed" },
  { value: "RETURNED", label: "Returned" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function ShipmentStatusUpdater({
  shipmentId,
  currentStatus,
}: ShipmentStatusUpdaterProps): React.ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ShipmentStatus>(currentStatus);

  async function handleChange(next: string) {
    const nextStatus = next as ShipmentStatus;
    if (nextStatus === status) return;
    setError(null);
    setStatus(nextStatus);

    const res = await updateShipmentStatus(shipmentId, nextStatus);
    if (res.error) {
      setError(res.error);
      setStatus(currentStatus);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={handleChange} disabled={pending}>
        <SelectTrigger className="w-[180px] border-[#E8E0D5] bg-white text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && <Loader2 className="h-4 w-4 animate-spin text-[#CC785C]" />}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
