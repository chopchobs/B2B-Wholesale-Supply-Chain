"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import type { ShipmentStatus } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShipmentListItem } from "@/server/actions/shipments";

interface ShipmentTableClientProps {
  shipments: ShipmentListItem[];
}

const STATUS_OPTIONS: { value: ShipmentStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "READY_TO_SHIP", label: "Ready to Ship" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed" },
  { value: "RETURNED", label: "Returned" },
  { value: "CANCELLED", label: "Cancelled" },
];

function getStatusVariant(
  status: string
): "success" | "destructive" | "warning" | "info" | "default" {
  switch (status) {
    case "DELIVERED":
      return "success";
    case "CANCELLED":
    case "FAILED":
    case "RETURNED":
      return "destructive";
    case "PENDING":
    case "READY_TO_SHIP":
      return "warning";
    case "IN_TRANSIT":
    case "OUT_FOR_DELIVERY":
      return "info";
    default:
      return "default";
  }
}

export function ShipmentTableClient({
  shipments,
}: ShipmentTableClientProps): React.ReactElement {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ShipmentStatus | "ALL">("ALL");

  // กรอง shipment ตาม status + search keyword ฝั่ง client
  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      if (status !== "ALL" && s.status !== status) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          s.shipmentNumber.toLowerCase().includes(q) ||
          (s.trackingNumber ?? "").toLowerCase().includes(q) ||
          s.shipToName.toLowerCase().includes(q) ||
          (s.carrierName ?? "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [shipments, search, status]);

  return (
    <Card className="bg-white border-[#E8E0D5]">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#736B66]" />
            <Input
              placeholder="Search shipment #, tracking, customer..."
              className="pl-8 border-[#E8E0D5]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#736B66]" />
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ShipmentStatus | "ALL")}
            >
              <SelectTrigger className="w-[180px] border-[#E8E0D5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border border-[#E8E0D5] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F0E8] hover:bg-[#F5F0E8]">
                <TableHead className="text-[#736B66]">Shipment #</TableHead>
                <TableHead className="text-[#736B66]">Customer</TableHead>
                <TableHead className="text-[#736B66]">Carrier</TableHead>
                <TableHead className="text-[#736B66]">Tracking</TableHead>
                <TableHead className="text-[#736B66]">Items</TableHead>
                <TableHead className="text-[#736B66]">Status</TableHead>
                <TableHead className="text-right text-[#736B66]">
                  Cost
                </TableHead>
                <TableHead className="text-[#736B66]">Created</TableHead>
                <TableHead className="text-right text-[#736B66]">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-12 text-[#736B66] text-sm"
                  >
                    ไม่พบ shipment ที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id} className="hover:bg-[#F5F0E8]/40">
                    <TableCell className="font-mono text-xs text-[#2D2825]">
                      {s.shipmentNumber}
                    </TableCell>
                    <TableCell className="text-[#2D2825]">
                      <div className="font-medium">{s.shipToName}</div>
                      {s.shipToCity && (
                        <div className="text-xs text-[#736B66]">
                          {s.shipToCity}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-[#736B66] text-sm">
                      {s.carrierName ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#736B66]">
                      {s.trackingNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-[#2D2825] text-sm">
                      {s.itemCount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(s.status)}>
                        {s.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-[#2D2825]">
                      ฿
                      {s.shippingCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-[#736B66]">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/merchant/shipping/shipments/${s.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#E8E0D5] text-[#CC785C] hover:bg-[#F5F0E8] h-7 text-xs"
                        >
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-xs text-[#736B66]">
          แสดง {filtered.length} จาก {shipments.length} shipment
        </div>
      </CardContent>
    </Card>
  );
}
