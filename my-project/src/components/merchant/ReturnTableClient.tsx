"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import type { ReturnStatus, ReturnReason } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import type { ReturnListItem } from "@/server/actions/returns";

interface ReturnTableClientProps {
  returns: ReturnListItem[];
}

const STATUS_OPTIONS: { value: ReturnStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "REQUESTED", label: "Requested" },
  { value: "APPROVED", label: "Approved" },
  { value: "RECEIVED", label: "Received" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

const REASON_OPTIONS: { value: ReturnReason | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Reasons" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "DEFECTIVE", label: "Defective" },
  { value: "WRONG_ITEM", label: "Wrong Item" },
  { value: "NOT_AS_DESCRIBED", label: "Not as Described" },
  { value: "CUSTOMER_CHANGED_MIND", label: "Changed Mind" },
  { value: "OTHER", label: "Other" },
];

function getStatusVariant(
  status: ReturnStatus,
): "success" | "destructive" | "warning" | "info" | "default" {
  switch (status) {
    case "REFUNDED":
      return "success";
    case "REJECTED":
    case "CANCELLED":
      return "destructive";
    case "REQUESTED":
      return "warning";
    case "APPROVED":
    case "RECEIVED":
      return "info";
    default:
      return "default";
  }
}

export function ReturnTableClient({
  returns,
}: ReturnTableClientProps): React.ReactElement {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReturnStatus | "ALL">("ALL");
  const [reason, setReason] = useState<ReturnReason | "ALL">("ALL");

  // กรอง returns ตามเงื่อนไขฝั่ง client
  const filtered = useMemo(() => {
    return returns.filter((r) => {
      if (status !== "ALL" && r.status !== status) return false;
      if (reason !== "ALL" && r.reason !== reason) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          r.returnNumber.toLowerCase().includes(q) ||
          r.orderId.toLowerCase().includes(q) ||
          (r.customerName ?? "").toLowerCase().includes(q) ||
          r.customerEmail.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [returns, search, status, reason]);

  return (
    <Card className="bg-white border-[#E8E0D5]">
      <CardContent className="p-3 sm:p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#736B66]" />
            <Input
              placeholder="ค้นหา RMA #, order ID, ลูกค้า..."
              className="pl-8 border-[#E8E0D5]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Filter className="h-4 w-4 text-[#736B66] shrink-0" />
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ReturnStatus | "ALL")}
            >
              <SelectTrigger className="w-full sm:w-[160px] border-[#E8E0D5]">
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
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as ReturnReason | "ALL")}
            >
              <SelectTrigger className="w-full sm:w-[170px] border-[#E8E0D5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border border-[#E8E0D5] overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-[#F5F0E8] hover:bg-[#F5F0E8]">
                <TableHead className="text-[#736B66]">RMA #</TableHead>
                <TableHead className="text-[#736B66]">Customer</TableHead>
                <TableHead className="text-[#736B66]">Order</TableHead>
                <TableHead className="text-[#736B66]">Reason</TableHead>
                <TableHead className="text-[#736B66]">Items</TableHead>
                <TableHead className="text-[#736B66]">Status</TableHead>
                <TableHead className="text-right text-[#736B66]">
                  Refund
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
                    ไม่พบคำขอคืนที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id} className="hover:bg-[#F5F0E8]/40">
                    <TableCell className="font-mono text-xs text-[#2D2825] whitespace-nowrap">
                      {r.returnNumber}
                    </TableCell>
                    <TableCell className="text-[#2D2825] max-w-[200px]">
                      <div className="font-medium truncate">
                        {r.customerName ?? "—"}
                      </div>
                      <div className="text-xs text-[#736B66] truncate">
                        {r.customerEmail}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#736B66] whitespace-nowrap">
                      #{r.orderId.substring(0, 8)}
                    </TableCell>
                    <TableCell className="text-[#736B66] text-xs whitespace-nowrap">
                      {r.reason.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-[#2D2825] text-sm whitespace-nowrap">
                      {r.itemCount} ({r.totalQuantity} ชิ้น)
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(r.status)}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-[#2D2825] whitespace-nowrap">
                      ฿
                      {r.refundAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-[#736B66] whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/merchant/returns/${r.id}`}>
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
          แสดง {filtered.length} จาก {returns.length} รายการ
        </div>
      </CardContent>
    </Card>
  );
}
