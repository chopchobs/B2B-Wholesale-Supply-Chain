"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";
import { Printer, Send, CreditCard, XCircle, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoicePrintView } from "@/components/merchant/InvoicePrintView";
import { RecordPaymentDialog } from "@/components/merchant/RecordPaymentDialog";
import {
  recordPayment,
  updateInvoiceStatus,
  type InvoiceDetail,
  type InvoiceListItem,
} from "@/server/actions/invoices";

interface InvoiceDetailClientProps {
  invoice: InvoiceDetail;
}

function methodLabel(m: PaymentMethod): string {
  switch (m) {
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "CREDIT":
      return "Credit";
    case "CASH":
      return "Cash";
    default:
      return m;
  }
}

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

export function InvoiceDetailClient(
  props: InvoiceDetailClientProps
): React.ReactElement {
  const { invoice } = props;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [, startTransition] = useTransition();

  const listItem: InvoiceListItem = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issuedAt: invoice.issuedAt,
    dueDate: invoice.dueDate,
    paidAt: invoice.paidAt,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    notes: invoice.notes,
    orderId: invoice.orderId,
    order: invoice.order,
  };

  async function handleStatus(status: InvoiceStatus) {
    setBusy(true);
    const res = await updateInvoiceStatus(invoice.id, status);
    setBusy(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  const canSend = invoice.status === InvoiceStatus.DRAFT;
  const canPay =
    invoice.status !== InvoiceStatus.PAID &&
    invoice.status !== InvoiceStatus.CANCELLED;
  const canCancel =
    invoice.status !== InvoiceStatus.CANCELLED &&
    invoice.status !== InvoiceStatus.PAID;

  return (
    <div className="space-y-6">
      {/* Action bar — hidden in print */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-[#CC785C]" />
          <div>
            <h1 className="text-2xl font-bold text-[#2D2825]">
              {invoice.invoiceNumber}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusVariant(invoice.status)}>
                {invoice.status}
              </Badge>
              <span className="text-xs text-[#736B66]">
                Issued {new Date(invoice.issuedAt).toLocaleDateString()} · Due{" "}
                {new Date(invoice.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canSend && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => handleStatus(InvoiceStatus.SENT)}
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
            >
              <Send className="mr-2 h-4 w-4 text-[#CC785C]" />
              Mark as Sent
            </Button>
          )}
          {canPay && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => setPaymentOpen(true)}
              className="bg-[#CC785C] text-white hover:bg-[#B86548]"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
          >
            <Printer className="mr-2 h-4 w-4 text-[#D4A574]" />
            Print / PDF
          </Button>
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => handleStatus(InvoiceStatus.CANCELLED)}
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Printable invoice */}
      <div id="invoice-print-area">
        <InvoicePrintView invoice={invoice} />
      </div>

      {/* Payment history — hidden in print */}
      <Card className="bg-white border-[#E8E0D5] print:hidden">
        <CardHeader>
          <CardTitle className="text-[#2D2825]">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.payments.length === 0 ? (
            <div className="text-sm text-[#736B66] py-6 text-center">
              ยังไม่มีการบันทึกการชำระเงิน
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F0E8]">
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm text-[#2D2825]">
                      {new Date(p.paidAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825]">
                      {methodLabel(p.method)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-[#736B66]">
                      {p.reference || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-[#736B66]">
                      {p.note || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#CC785C]">
                      ฿
                      {p.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RecordPaymentDialog
        invoice={listItem}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onRecorded={() => {
          setPaymentOpen(false);
          startTransition(() => router.refresh());
        }}
        onSubmit={async (values) => {
          const res = await recordPayment(invoice.id, values);
          if (res.error) return { ok: false, error: res.error };
          return { ok: true };
        }}
      />
    </div>
  );
}
