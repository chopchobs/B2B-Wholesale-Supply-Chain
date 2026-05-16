"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InvoiceStatus } from "@prisma/client";
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
  CreditCard,
  XCircle,
  FileText,
} from "lucide-react";
import {
  recordPayment,
  updateInvoiceStatus,
  type InvoiceListItem,
} from "@/server/actions/invoices";
import { RecordPaymentDialog } from "@/components/merchant/RecordPaymentDialog";

type FilterValue = "ALL" | InvoiceStatus;

interface InvoiceTableClientProps {
  invoices: InvoiceListItem[];
  initialFilter?: FilterValue;
}

const FILTER_TABS: { value: FilterValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
];

function statusVariant(
  status: InvoiceStatus
): "success" | "destructive" | "warning" | "info" | "secondary" {
  switch (status) {
    case InvoiceStatus.PAID:
      return "success";
    case InvoiceStatus.OVERDUE:
      return "destructive";
    case InvoiceStatus.SENT:
      return "info";
    case InvoiceStatus.DRAFT:
      return "warning";
    case InvoiceStatus.CANCELLED:
    default:
      return "secondary";
  }
}

function formatTHB(n: number): string {
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString();
}

export function InvoiceTableClient(
  props: InvoiceTableClientProps
): React.ReactElement {
  const { invoices, initialFilter = "ALL" } = props;
  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>(initialFilter);
  const [paymentTarget, setPaymentTarget] = useState<InvoiceListItem | null>(
    null
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "ALL") return invoices;
    // SENT ที่เลยกำหนดให้ปรากฏใน Overdue tab ด้วย
    if (filter === "OVERDUE") {
      const now = new Date();
      return invoices.filter(
        (i) =>
          i.status === InvoiceStatus.OVERDUE ||
          (i.status === InvoiceStatus.SENT && new Date(i.dueDate) < now)
      );
    }
    return invoices.filter((i) => i.status === filter);
  }, [invoices, filter]);

  async function handleStatusChange(id: string, status: InvoiceStatus) {
    setBusyId(id);
    const res = await updateInvoiceStatus(id, status);
    setBusyId(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
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
          <FileText className="mx-auto h-12 w-12 text-[#D4A574] mb-3" />
          <h3 className="text-lg font-medium text-[#2D2825]">
            No invoices found
          </h3>
          <p className="text-[#736B66] text-sm">
            ลองเปลี่ยน filter หรือออกใบแจ้งหนี้จากหน้า Orders
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F0E8]">
                <TableHead className="text-[#2D2825]">Invoice #</TableHead>
                <TableHead className="text-[#2D2825]">Customer</TableHead>
                <TableHead className="text-[#2D2825]">Order #</TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  Amount
                </TableHead>
                <TableHead className="text-center text-[#2D2825]">
                  Status
                </TableHead>
                <TableHead className="text-[#2D2825]">Due Date</TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => {
                const isOverdue =
                  inv.status === InvoiceStatus.SENT &&
                  new Date(inv.dueDate) < new Date();
                const effectiveStatus = isOverdue
                  ? InvoiceStatus.OVERDUE
                  : inv.status;
                return (
                  <TableRow
                    key={inv.id}
                    className="hover:bg-[#F5F0E8]/40 transition-colors"
                  >
                    <TableCell className="font-mono text-sm text-[#2D2825]">
                      <Link
                        href={`/merchant/invoices/${inv.id}`}
                        className="text-[#CC785C] hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-[#2D2825]">
                        {inv.order.user.name || "N/A"}
                      </div>
                      <div className="text-xs text-[#736B66]">
                        {inv.order.user.email}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#736B66]">
                      #{inv.orderId.substring(0, 8)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#2D2825]">
                      {formatTHB(inv.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusVariant(effectiveStatus)}>
                        {busyId === inv.id ? "Updating..." : effectiveStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825]">
                      {formatDate(inv.dueDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={busyId === inv.id}
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
                              href={`/merchant/invoices/${inv.id}`}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4 text-[#736B66]" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          {inv.status === InvoiceStatus.DRAFT && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(inv.id, InvoiceStatus.SENT)
                              }
                              className="cursor-pointer"
                            >
                              <Send className="mr-2 h-4 w-4 text-[#CC785C]" />
                              Mark as Sent
                            </DropdownMenuItem>
                          )}
                          {inv.status !== InvoiceStatus.PAID &&
                            inv.status !== InvoiceStatus.CANCELLED && (
                              <DropdownMenuItem
                                onClick={() => setPaymentTarget(inv)}
                                className="cursor-pointer"
                              >
                                <CreditCard className="mr-2 h-4 w-4 text-[#D4A574]" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                          {inv.status !== InvoiceStatus.CANCELLED &&
                            inv.status !== InvoiceStatus.PAID && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(
                                      inv.id,
                                      InvoiceStatus.CANCELLED
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <RecordPaymentDialog
        invoice={paymentTarget}
        open={!!paymentTarget}
        onOpenChange={(o) => {
          if (!o) setPaymentTarget(null);
        }}
        onRecorded={() => {
          setPaymentTarget(null);
          startTransition(() => router.refresh());
        }}
        onSubmit={async (values) => {
          if (!paymentTarget) return { ok: false, error: "No invoice" };
          const res = await recordPayment(paymentTarget.id, values);
          if (res.error) return { ok: false, error: res.error };
          return { ok: true };
        }}
      />
    </div>
  );
}
