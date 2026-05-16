"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PurchaseOrderStatus } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  MoreHorizontal,
  Send,
  CheckCircle2,
  PackageCheck,
  XCircle,
  ClipboardList,
} from "lucide-react";
import {
  receivePurchaseOrder,
  updatePurchaseOrderStatus,
  type PurchaseOrderListItem,
} from "@/server/actions/purchaseOrders";

type FilterValue = "ALL" | PurchaseOrderStatus;

interface PurchaseOrderTableClientProps {
  purchaseOrders: PurchaseOrderListItem[];
  initialFilter?: FilterValue;
}

const FILTER_TABS: { value: FilterValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "RECEIVED", label: "Received" },
  { value: "CANCELLED", label: "Cancelled" },
];

function statusVariant(
  status: PurchaseOrderStatus
): "success" | "destructive" | "warning" | "info" | "secondary" {
  switch (status) {
    case PurchaseOrderStatus.RECEIVED:
      return "success";
    case PurchaseOrderStatus.CANCELLED:
      return "destructive";
    case PurchaseOrderStatus.SENT:
      return "info";
    case PurchaseOrderStatus.CONFIRMED:
      return "info";
    case PurchaseOrderStatus.DRAFT:
      return "warning";
    default:
      return "secondary";
  }
}

function formatTHB(n: number): string {
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export function PurchaseOrderTableClient(
  props: PurchaseOrderTableClientProps
): React.ReactElement {
  const { purchaseOrders, initialFilter = "ALL" } = props;
  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>(initialFilter);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "ALL") return purchaseOrders;
    return purchaseOrders.filter((po) => po.status === filter);
  }, [purchaseOrders, filter]);

  async function handleStatusChange(id: string, status: PurchaseOrderStatus) {
    setBusyId(id);
    const res = await updatePurchaseOrderStatus(id, status);
    setBusyId(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function handleReceive(id: string) {
    setBusyId(id);
    const res = await receivePurchaseOrder(id);
    setBusyId(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((t) => {
          const isActive = filter === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setFilter(t.value)}
              className={
                isActive
                  ? "px-3 py-1.5 text-sm rounded-full bg-[#CC785C] text-white border border-[#CC785C]"
                  : "px-3 py-1.5 text-sm rounded-full bg-white text-[#2D2825] border border-[#E8E0D5] hover:bg-[#F5F0E8]"
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-[#E8E0D5]">
          <ClipboardList className="mx-auto h-12 w-12 text-[#D4A574] mb-3" />
          <h3 className="text-lg font-medium text-[#2D2825]">
            No purchase orders found
          </h3>
          <p className="text-[#736B66] text-sm">
            ลองเปลี่ยน filter หรือสร้าง PO ใหม่
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F0E8]">
                <TableHead className="text-[#2D2825]">PO #</TableHead>
                <TableHead className="text-[#2D2825]">Supplier</TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  Items
                </TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  Total
                </TableHead>
                <TableHead className="text-center text-[#2D2825]">
                  Status
                </TableHead>
                <TableHead className="text-[#2D2825]">Expected</TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((po) => (
                <TableRow
                  key={po.id}
                  className="hover:bg-[#F5F0E8]/40 transition-colors"
                >
                  <TableCell className="font-mono text-sm">
                    <Link
                      href={`/merchant/purchase-orders/${po.id}`}
                      className="text-[#CC785C] hover:underline"
                    >
                      {po.poNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/merchant/suppliers/${po.supplierId}`}
                      className="font-medium text-[#2D2825] hover:underline"
                    >
                      {po.supplier.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-[#2D2825]">
                    {po.itemCount}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[#2D2825]">
                    {formatTHB(po.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusVariant(po.status)}>
                      {busyId === po.id ? "Updating..." : po.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#2D2825]">
                    {formatDate(po.expectedDelivery)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={busyId === po.id}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-white border-[#E8E0D5]"
                      >
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/merchant/purchase-orders/${po.id}`}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4 text-[#736B66]" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        {po.status === PurchaseOrderStatus.DRAFT && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(
                                po.id,
                                PurchaseOrderStatus.SENT
                              )
                            }
                            className="cursor-pointer"
                          >
                            <Send className="mr-2 h-4 w-4 text-[#CC785C]" />
                            Mark as Sent
                          </DropdownMenuItem>
                        )}
                        {po.status === PurchaseOrderStatus.SENT && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(
                                po.id,
                                PurchaseOrderStatus.CONFIRMED
                              )
                            }
                            className="cursor-pointer"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4 text-[#D4A574]" />
                            Mark Confirmed
                          </DropdownMenuItem>
                        )}
                        {po.status !== PurchaseOrderStatus.RECEIVED &&
                          po.status !== PurchaseOrderStatus.CANCELLED && (
                            <DropdownMenuItem
                              onClick={() => handleReceive(po.id)}
                              className="cursor-pointer"
                            >
                              <PackageCheck className="mr-2 h-4 w-4 text-[#CC785C]" />
                              Receive & Restock
                            </DropdownMenuItem>
                          )}
                        {po.status !== PurchaseOrderStatus.CANCELLED &&
                          po.status !== PurchaseOrderStatus.RECEIVED && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(
                                    po.id,
                                    PurchaseOrderStatus.CANCELLED
                                  )
                                }
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
