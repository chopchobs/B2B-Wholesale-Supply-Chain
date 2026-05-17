"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Search, PackageX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  WarehouseInventoryRow,
  WarehouseInventoryStatus,
} from "@/server/actions/warehouse";

interface WarehouseInventoryTableProps {
  items: WarehouseInventoryRow[];
}

// คืน className สำหรับ badge สถานะตามสต็อก
function getStatusBadgeClass(status: WarehouseInventoryStatus): string {
  switch (status) {
    case "OUT":
      return "bg-[#CC785C]/15 text-[#CC785C] border-[#CC785C]/30";
    case "LOW":
      return "bg-[#D4A574]/20 text-[#8a6a3d] border-[#D4A574]/40";
    case "OK":
    default:
      return "bg-[#E8E0D5] text-[#736B66] border-[#E8E0D5]";
  }
}

function getStatusLabel(status: WarehouseInventoryStatus): string {
  switch (status) {
    case "OUT":
      return "Out of Stock";
    case "LOW":
      return "Low";
    case "OK":
    default:
      return "OK";
  }
}

export function WarehouseInventoryTable(
  props: WarehouseInventoryTableProps
): React.ReactElement {
  const { items } = props;
  const [query, setQuery] = useState<string>("");

  // กรองรายการตามชื่อสินค้า หรือ SKU (case-insensitive)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.productName.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q)
    );
  }, [items, query]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[#E8E0D5] bg-white p-10 text-center">
        <PackageX className="h-10 w-10 text-[#736B66] mx-auto mb-3" />
        <p className="text-[#2D2825] font-semibold">No inventory yet</p>
        <p className="text-sm text-[#736B66] mt-1">
          ยังไม่มีสินค้าในคลังนี้ ใช้ Stock Transfer เพื่อย้ายสินค้าเข้าคลัง
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#736B66]" />
        <Input
          placeholder="Search by product name or SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-white border-[#E8E0D5]"
        />
      </div>

      <div className="rounded-xl border border-[#E8E0D5] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F5F0E8] hover:bg-[#F5F0E8] border-[#E8E0D5]">
              <TableHead className="text-[#2D2825] font-semibold">
                Product
              </TableHead>
              <TableHead className="text-[#2D2825] font-semibold">SKU</TableHead>
              <TableHead className="text-[#2D2825] font-semibold text-right">
                Quantity
              </TableHead>
              <TableHead className="text-[#2D2825] font-semibold text-right">
                Low Threshold
              </TableHead>
              <TableHead className="text-[#2D2825] font-semibold">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-[#736B66] py-8"
                >
                  ไม่พบสินค้าที่ตรงกับคำค้น
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-[#E8E0D5] hover:bg-[#F5F0E8]/50"
                >
                  <TableCell className="font-medium text-[#2D2825]">
                    {row.productName}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-[#736B66]">
                    {row.sku}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[#2D2825]">
                    {row.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-[#736B66]">
                    {row.lowStockThreshold.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusBadgeClass(row.status)}
                    >
                      {getStatusLabel(row.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
