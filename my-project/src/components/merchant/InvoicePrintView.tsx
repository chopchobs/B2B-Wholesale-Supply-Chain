import React from "react";
import { InvoiceStatus } from "@prisma/client";
import type { InvoiceDetail } from "@/server/actions/invoices";

interface InvoicePrintViewProps {
  invoice: InvoiceDetail;
}

function formatTHB(n: number): string {
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString();
}

export function InvoicePrintView(
  props: InvoicePrintViewProps
): React.ReactElement {
  const { invoice } = props;
  const isPaid = invoice.status === InvoiceStatus.PAID;
  const isCancelled = invoice.status === InvoiceStatus.CANCELLED;

  return (
    <div className="bg-white border border-[#E8E0D5] rounded-xl p-8 print:border-0 print:rounded-none print:shadow-none">
      {/* Print-only header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[#2D2825] tracking-tight">
            INVOICE
          </h2>
          <p className="text-[#736B66] text-sm mt-1 font-mono">
            {invoice.invoiceNumber}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-[#CC785C]">
            B2B Wholesale Co.
          </div>
          <p className="text-xs text-[#736B66] mt-1 leading-tight">
            Bangkok, Thailand
            <br />
            contact@b2bwholesale.example
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
        <div>
          <div className="text-[#736B66] text-xs uppercase tracking-wide">
            Issued
          </div>
          <div className="text-[#2D2825] font-medium">
            {formatDate(invoice.issuedAt)}
          </div>
        </div>
        <div>
          <div className="text-[#736B66] text-xs uppercase tracking-wide">
            Due Date
          </div>
          <div className="text-[#2D2825] font-medium">
            {formatDate(invoice.dueDate)}
          </div>
        </div>
        <div>
          <div className="text-[#736B66] text-xs uppercase tracking-wide">
            Status
          </div>
          <div
            className={
              isPaid
                ? "text-green-700 font-semibold"
                : isCancelled
                  ? "text-destructive font-semibold"
                  : "text-[#CC785C] font-semibold"
            }
          >
            {invoice.status}
          </div>
        </div>
        <div>
          <div className="text-[#736B66] text-xs uppercase tracking-wide">
            Order #
          </div>
          <div className="text-[#2D2825] font-mono text-xs">
            {invoice.orderId.substring(0, 12)}
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-6 p-4 bg-[#F5F0E8] border border-[#E8E0D5] rounded-lg print:bg-transparent">
        <div className="text-[#736B66] text-xs uppercase tracking-wide mb-1">
          Bill To
        </div>
        <div className="text-[#2D2825] font-semibold">
          {invoice.order.user.name || "—"}
        </div>
        <div className="text-[#736B66] text-sm">{invoice.order.user.email}</div>
      </div>

      {/* Line items */}
      <div className="overflow-hidden border border-[#E8E0D5] rounded-lg mb-6">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F0E8] text-[#2D2825]">
            <tr>
              <th className="text-left px-4 py-2 font-medium">SKU</th>
              <th className="text-left px-4 py-2 font-medium">Product</th>
              <th className="text-right px-4 py-2 font-medium">Qty</th>
              <th className="text-right px-4 py-2 font-medium">Unit Price</th>
              <th className="text-right px-4 py-2 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it) => (
              <tr
                key={it.id}
                className="border-t border-[#E8E0D5] text-[#2D2825]"
              >
                <td className="px-4 py-2 font-mono text-xs text-[#736B66]">
                  {it.product.sku}
                </td>
                <td className="px-4 py-2">{it.product.name}</td>
                <td className="px-4 py-2 text-right">{it.quantity}</td>
                <td className="px-4 py-2 text-right">
                  {formatTHB(it.unitPrice)}
                </td>
                <td className="px-4 py-2 text-right font-medium">
                  {formatTHB(it.subTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-[#736B66]">
            <span>Subtotal</span>
            <span className="text-[#2D2825]">
              {formatTHB(invoice.subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-[#736B66]">
            <span>Tax</span>
            <span className="text-[#2D2825]">{formatTHB(invoice.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-[#E8E0D5] pt-2 mt-1">
            <span className="font-semibold text-[#2D2825]">Total</span>
            <span className="font-bold text-[#CC785C] text-base">
              {formatTHB(invoice.total)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-[#736B66] pt-1">
            <span>Paid</span>
            <span>{formatTHB(invoice.totalPaid)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#736B66]">Balance Due</span>
            <span
              className={
                invoice.balanceDue > 0
                  ? "text-destructive font-semibold"
                  : "text-green-700 font-semibold"
              }
            >
              {formatTHB(invoice.balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="border-t border-[#E8E0D5] pt-4 text-sm">
          <div className="text-[#736B66] text-xs uppercase tracking-wide mb-1">
            Notes
          </div>
          <p className="text-[#2D2825] whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-[#E8E0D5] text-xs text-[#736B66] text-center">
        Thank you for your business.
      </div>
    </div>
  );
}
