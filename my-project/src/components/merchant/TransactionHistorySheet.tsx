"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  PackagePlus,
  Sliders,
  ShoppingCart,
  Undo2,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

import {
  getInventoryTransactions,
  type InventoryItemWithProduct,
  type InventoryTransactionRow,
} from "@/server/actions/inventory";
import type { InventoryTransactionType } from "@prisma/client";

interface TransactionHistorySheetProps {
  item: InventoryItemWithProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function typeIcon(type: InventoryTransactionType) {
  switch (type) {
    case "RESTOCK":
      return <PackagePlus className="h-4 w-4 text-[#CC785C]" />;
    case "SALE":
      return <ShoppingCart className="h-4 w-4 text-[#736B66]" />;
    case "ADJUSTMENT":
      return <Sliders className="h-4 w-4 text-[#D4A574]" />;
    case "RETURN":
      return <Undo2 className="h-4 w-4 text-[#736B66]" />;
    default:
      return null;
  }
}

function typeBadge(type: InventoryTransactionType) {
  const variant: "default" | "secondary" | "success" | "warning" | "info" =
    type === "RESTOCK"
      ? "success"
      : type === "SALE"
      ? "info"
      : type === "ADJUSTMENT"
      ? "warning"
      : "secondary";
  return (
    <Badge variant={variant} className="text-[10px] font-semibold">
      {type}
    </Badge>
  );
}

export function TransactionHistorySheet(props: TransactionHistorySheetProps) {
  const { item, open, onOpenChange } = props;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<InventoryTransactionRow[]>([]);

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    // ใช้ requestId เพื่อกัน race condition แทน setState สดๆ ใน effect body
    requestIdRef.current += 1;
    const myId = requestIdRef.current;

    async function load() {
      const res = await getInventoryTransactions(item.id);
      if (requestIdRef.current !== myId) return;
      if (res.error) {
        setError(res.error);
        setRows([]);
      } else {
        setError(null);
        setRows(res.data ?? []);
      }
      setLoading(false);
    }

    void load();
  }, [open, item.id]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col h-full bg-white border-l border-[#E8E0D5]">
        <SheetHeader>
          <SheetTitle className="text-[#2D2825]">Transaction History</SheetTitle>
          <SheetDescription className="text-[#736B66]">
            <span className="font-semibold text-[#2D2825]">
              {item.productName}
            </span>{" "}
            <span className="font-mono">({item.sku})</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {loading && (
            <div className="flex items-center justify-center py-12 text-[#736B66]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading...
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="text-center py-12 text-[#736B66] text-sm">
              ยังไม่มีรายการเคลื่อนไหวสต็อก
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
            <ul className="space-y-3">
              {rows.map((tx) => {
                const positive = tx.quantityDelta >= 0;
                return (
                  <li
                    key={tx.id}
                    className="rounded-lg border border-[#E8E0D5] bg-white p-3 flex items-start gap-3"
                  >
                    <div className="mt-0.5">{typeIcon(tx.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {typeBadge(tx.type)}
                          <span className="text-xs text-[#736B66]">
                            {new Date(tx.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div
                          className={
                            positive
                              ? "flex items-center gap-1 text-sm font-semibold text-[#CC785C]"
                              : "flex items-center gap-1 text-sm font-semibold text-destructive"
                          }
                        >
                          {positive ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {positive ? "+" : ""}
                          {tx.quantityDelta}
                        </div>
                      </div>
                      {tx.note && (
                        <p className="mt-1 text-sm text-[#2D2825] whitespace-pre-wrap">
                          {tx.note}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
