"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  InboundShipmentStatus,
  PurchaseOrderStatus,
} from "@prisma/client";
import {
  ClipboardList,
  Send,
  CheckCircle2,
  PackageCheck,
  XCircle,
  Truck,
  Plus,
} from "lucide-react";

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
import {
  receivePurchaseOrder,
  updatePurchaseOrderStatus,
  type PurchaseOrderDetail,
} from "@/server/actions/purchaseOrders";
import { AddShipmentDialog } from "@/components/merchant/AddShipmentDialog";

interface PurchaseOrderDetailClientProps {
  purchaseOrder: PurchaseOrderDetail;
}

function statusVariant(
  status: PurchaseOrderStatus
): "success" | "destructive" | "warning" | "info" | "secondary" {
  switch (status) {
    case PurchaseOrderStatus.RECEIVED:
      return "success";
    case PurchaseOrderStatus.CANCELLED:
      return "destructive";
    case PurchaseOrderStatus.SENT:
    case PurchaseOrderStatus.CONFIRMED:
      return "info";
    case PurchaseOrderStatus.DRAFT:
      return "warning";
    default:
      return "secondary";
  }
}

function shipmentVariant(
  status: InboundShipmentStatus
): "success" | "destructive" | "info" {
  switch (status) {
    case InboundShipmentStatus.DELIVERED:
      return "success";
    case InboundShipmentStatus.DELAYED:
      return "destructive";
    case InboundShipmentStatus.IN_TRANSIT:
    default:
      return "info";
  }
}

function formatTHB(n: number): string {
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export function PurchaseOrderDetailClient(
  props: PurchaseOrderDetailClientProps
): React.ReactElement {
  const { purchaseOrder } = props;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function handleStatus(status: PurchaseOrderStatus) {
    setBusy(true);
    const res = await updatePurchaseOrderStatus(purchaseOrder.id, status);
    setBusy(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function handleReceive() {
    setBusy(true);
    const res = await receivePurchaseOrder(purchaseOrder.id);
    setBusy(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  const canSend = purchaseOrder.status === PurchaseOrderStatus.DRAFT;
  const canConfirm = purchaseOrder.status === PurchaseOrderStatus.SENT;
  const canReceive =
    purchaseOrder.status !== PurchaseOrderStatus.RECEIVED &&
    purchaseOrder.status !== PurchaseOrderStatus.CANCELLED;
  const canCancel =
    purchaseOrder.status !== PurchaseOrderStatus.CANCELLED &&
    purchaseOrder.status !== PurchaseOrderStatus.RECEIVED;
  const canAddShipment =
    purchaseOrder.status !== PurchaseOrderStatus.CANCELLED &&
    purchaseOrder.status !== PurchaseOrderStatus.RECEIVED;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-[#CC785C]" />
          <div>
            <h1 className="text-2xl font-bold text-[#2D2825]">
              {purchaseOrder.poNumber}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusVariant(purchaseOrder.status)}>
                {purchaseOrder.status}
              </Badge>
              <span className="text-xs text-[#736B66]">
                Created{" "}
                {new Date(purchaseOrder.createdAt).toLocaleDateString()}
                {purchaseOrder.expectedDelivery
                  ? ` · Expected ${new Date(
                      purchaseOrder.expectedDelivery
                    ).toLocaleDateString()}`
                  : ""}
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
              onClick={() => handleStatus(PurchaseOrderStatus.SENT)}
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
            >
              <Send className="mr-2 h-4 w-4 text-[#CC785C]" />
              Mark as Sent
            </Button>
          )}
          {canConfirm && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => handleStatus(PurchaseOrderStatus.CONFIRMED)}
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
            >
              <CheckCircle2 className="mr-2 h-4 w-4 text-[#D4A574]" />
              Mark Confirmed
            </Button>
          )}
          {canAddShipment && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setShipmentOpen(true)}
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
            >
              <Plus className="mr-2 h-4 w-4 text-[#D4A574]" />
              Add Shipment
            </Button>
          )}
          {canReceive && (
            <Button
              size="sm"
              disabled={busy}
              onClick={handleReceive}
              className="bg-[#CC785C] text-white hover:bg-[#B86548]"
            >
              <PackageCheck className="mr-2 h-4 w-4" />
              Receive & Restock
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => handleStatus(PurchaseOrderStatus.CANCELLED)}
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-[#E8E0D5] md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base text-[#2D2825]">Supplier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Link
              href={`/merchant/suppliers/${purchaseOrder.supplierId}`}
              className="font-semibold text-[#CC785C] hover:underline"
            >
              {purchaseOrder.supplier.name}
            </Link>
            <div className="text-[#736B66]">
              {purchaseOrder.supplier.email ?? "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5] md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-[#2D2825]">
              PO Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-[#736B66] text-xs">Items</div>
              <div className="font-semibold text-[#2D2825]">
                {purchaseOrder.items.length}
              </div>
            </div>
            <div>
              <div className="text-[#736B66] text-xs">Subtotal</div>
              <div className="font-semibold text-[#2D2825]">
                {formatTHB(purchaseOrder.subtotal)}
              </div>
            </div>
            <div>
              <div className="text-[#736B66] text-xs">Total</div>
              <div className="font-bold text-[#CC785C] text-lg">
                {formatTHB(purchaseOrder.total)}
              </div>
            </div>
            {purchaseOrder.notes && (
              <div className="col-span-3 pt-2 border-t border-[#E8E0D5]">
                <div className="text-[#736B66] text-xs mb-1">Notes</div>
                <div className="text-[#2D2825] whitespace-pre-wrap">
                  {purchaseOrder.notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader>
          <CardTitle className="text-[#2D2825]">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseOrder.items.length === 0 ? (
            <div className="text-sm text-[#736B66] py-6 text-center">
              ไม่มีรายการสินค้า
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F0E8]">
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-mono text-xs text-[#736B66]">
                      {it.product.sku}
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825]">
                      {it.product.name}
                    </TableCell>
                    <TableCell className="text-right text-[#2D2825]">
                      {it.quantity}
                    </TableCell>
                    <TableCell className="text-right text-[#2D2825]">
                      {formatTHB(it.unitCost)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#CC785C]">
                      {formatTHB(it.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[#2D2825]">
            <Truck className="h-5 w-5 text-[#D4A574]" />
            Shipment Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseOrder.shipments.length === 0 ? (
            <div className="text-sm text-[#736B66] py-6 text-center">
              ยังไม่มีบันทึก shipment
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F0E8]">
                  <TableHead>Tracking</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Shipped</TableHead>
                  <TableHead>Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.shipments.map((sh) => (
                  <TableRow key={sh.id}>
                    <TableCell className="font-mono text-xs text-[#2D2825]">
                      {sh.trackingNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825]">
                      {sh.carrier ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={shipmentVariant(sh.status)}>
                        {sh.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#736B66]">
                      {formatDate(sh.shippedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-[#736B66]">
                      {formatDate(sh.receivedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddShipmentDialog
        purchaseOrderId={purchaseOrder.id}
        open={shipmentOpen}
        onOpenChange={setShipmentOpen}
      />
    </div>
  );
}
