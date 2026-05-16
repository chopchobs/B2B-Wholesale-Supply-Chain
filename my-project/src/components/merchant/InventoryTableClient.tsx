"use client";

import React, { useMemo, useState } from "react";
import { MoreHorizontal, PackagePlus, Sliders, History } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type {
  InventoryItemWithProduct,
  InventoryStatus,
} from "@/server/actions/inventory";
import { RestockDialog } from "@/components/merchant/RestockDialog";
import { AdjustInventoryDialog } from "@/components/merchant/AdjustInventoryDialog";
import { TransactionHistorySheet } from "@/components/merchant/TransactionHistorySheet";

type StatusFilter = "ALL" | "LOW" | "OUT";

interface InventoryTableClientProps {
  items: InventoryItemWithProduct[];
}

function statusBadge(status: InventoryStatus) {
  switch (status) {
    case "OUT":
      return (
        <Badge variant="destructive" className="font-semibold">
          Out of Stock
        </Badge>
      );
    case "LOW":
      return (
        <Badge variant="warning" className="font-semibold">
          Low Stock
        </Badge>
      );
    case "OK":
    default:
      return (
        <Badge variant="success" className="font-semibold">
          In Stock
        </Badge>
      );
  }
}

export function InventoryTableClient(props: InventoryTableClientProps) {
  const { items } = props;

  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [restockTarget, setRestockTarget] =
    useState<InventoryItemWithProduct | null>(null);
  const [adjustTarget, setAdjustTarget] =
    useState<InventoryItemWithProduct | null>(null);
  const [historyTarget, setHistoryTarget] =
    useState<InventoryItemWithProduct | null>(null);

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    if (filter === "OUT") return items.filter((i) => i.status === "OUT");
    return items.filter((i) => i.status === "LOW");
  }, [items, filter]);

  const counts = useMemo(() => {
    let low = 0;
    let out = 0;
    for (const i of items) {
      if (i.status === "LOW") low += 1;
      else if (i.status === "OUT") out += 1;
    }
    return { all: items.length, low, out };
  }, [items]);

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <FilterButton
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
          label={`All (${counts.all})`}
        />
        <FilterButton
          active={filter === "LOW"}
          onClick={() => setFilter("LOW")}
          label={`Low Stock (${counts.low})`}
        />
        <FilterButton
          active={filter === "OUT"}
          onClick={() => setFilter("OUT")}
          label={`Out of Stock (${counts.out})`}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E8E0D5] bg-white text-[#2D2825] shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-[#F5F0E8]">
            <TableRow>
              <TableHead className="w-[140px] text-[#2D2825]">SKU</TableHead>
              <TableHead className="text-[#2D2825]">Product</TableHead>
              <TableHead className="text-right text-[#2D2825]">
                Current Stock
              </TableHead>
              <TableHead className="text-right text-[#2D2825]">
                Threshold
              </TableHead>
              <TableHead className="w-[140px] text-[#2D2825]">
                Status
              </TableHead>
              <TableHead className="w-[140px] text-[#2D2825]">
                Location
              </TableHead>
              <TableHead className="w-[80px] text-center text-[#2D2825]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow
                key={item.id}
                className="hover:bg-[#F5F0E8]/40 border-b border-[#E8E0D5]"
              >
                <TableCell className="font-mono text-sm text-[#736B66]">
                  {item.sku}
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-[#2D2825]">
                    {item.productName}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold text-[#2D2825]">
                  {item.quantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-[#736B66]">
                  {item.lowStockThreshold.toLocaleString()}
                </TableCell>
                <TableCell>{statusBadge(item.status)}</TableCell>
                <TableCell className="text-[#736B66]">
                  {item.location}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-[200px] bg-white border-[#E8E0D5]"
                    >
                      <DropdownMenuLabel className="text-[#2D2825]">
                        Actions
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-[#2D2825]"
                        onSelect={() => setRestockTarget(item)}
                      >
                        <PackagePlus className="mr-2 h-4 w-4 text-[#CC785C]" />
                        Restock
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-[#2D2825]"
                        onSelect={() => setAdjustTarget(item)}
                      >
                        <Sliders className="mr-2 h-4 w-4 text-[#D4A574]" />
                        Adjust
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-[#2D2825]"
                        onSelect={() => setHistoryTarget(item)}
                      >
                        <History className="mr-2 h-4 w-4 text-[#736B66]" />
                        Transaction History
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-[#736B66]"
                >
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <span className="text-lg font-medium text-[#2D2825]">
                      No inventory items
                    </span>
                    <span className="text-sm">
                      เมื่อมีสินค้าและสต็อก ระบบจะแสดงรายการที่นี่
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals / Sheets */}
      {restockTarget && (
        <RestockDialog
          item={restockTarget}
          open={restockTarget !== null}
          onOpenChange={(open) => {
            if (!open) setRestockTarget(null);
          }}
        />
      )}
      {adjustTarget && (
        <AdjustInventoryDialog
          item={adjustTarget}
          open={adjustTarget !== null}
          onOpenChange={(open) => {
            if (!open) setAdjustTarget(null);
          }}
        />
      )}
      {historyTarget && (
        <TransactionHistorySheet
          item={historyTarget}
          open={historyTarget !== null}
          onOpenChange={(open) => {
            if (!open) setHistoryTarget(null);
          }}
        />
      )}
    </>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function FilterButton(props: FilterButtonProps) {
  const { active, onClick, label } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "px-4 py-2 rounded-lg text-sm font-semibold bg-[#CC785C] text-white hover:bg-[#B86548] transition-colors"
          : "px-4 py-2 rounded-lg text-sm font-medium bg-white border border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8] transition-colors"
      }
    >
      {label}
    </button>
  );
}
