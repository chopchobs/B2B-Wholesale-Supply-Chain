"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  PackageCheck,
  Banknote,
  Loader2,
  RotateCcw,
  Ban,
  ExternalLink,
} from "lucide-react";
import type { ReturnStatus } from "@prisma/client";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  approveReturnRequest,
  rejectReturnRequest,
  markReturnReceived,
  processRefund,
  cancelReturnRequest,
  type ReturnDetail,
} from "@/server/actions/returns";

interface ReturnDetailClientProps {
  returnRequest: ReturnDetail;
}

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

export function ReturnDetailClient({
  returnRequest,
}: ReturnDetailClientProps): React.ReactElement {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // dialog states
  const [rejectOpen, setRejectOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [refundAmount, setRefundAmount] = useState<string>(
    String(returnRequest.refundAmount),
  );
  const [cancelNote, setCancelNote] = useState("");

  async function runAction(action: () => Promise<{ error: string | null }>) {
    setSubmitting(true);
    setError(null);
    const res = await action();
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return false;
    }
    startTransition(() => router.refresh());
    return true;
  }

  async function handleApprove() {
    // หมายเหตุ: ใช้ requestedById เป็น reviewer placeholder กรณีไม่มี auth context
    // ในระบบจริงควรใช้ session user id
    await runAction(() =>
      approveReturnRequest(returnRequest.id, returnRequest.requestedById),
    );
  }

  async function handleReject() {
    const ok = await runAction(() =>
      rejectReturnRequest(
        returnRequest.id,
        returnRequest.requestedById,
        rejectReason,
      ),
    );
    if (ok) {
      setRejectOpen(false);
      setRejectReason("");
    }
  }

  async function handleReceive() {
    await runAction(() => markReturnReceived(returnRequest.id));
  }

  async function handleRefund() {
    const amt = Number(refundAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      setError("ยอด refund ต้องมากกว่า 0");
      return;
    }
    const ok = await runAction(() => processRefund(returnRequest.id, amt));
    if (ok) setRefundOpen(false);
  }

  async function handleCancel() {
    const ok = await runAction(() =>
      cancelReturnRequest(returnRequest.id, cancelNote.trim() || undefined),
    );
    if (ok) {
      setCancelOpen(false);
      setCancelNote("");
    }
  }

  const canApprove = returnRequest.status === "REQUESTED";
  const canReject = ["REQUESTED", "APPROVED"].includes(returnRequest.status);
  const canReceive = returnRequest.status === "APPROVED";
  const canRefund = returnRequest.status === "RECEIVED";
  const canCancel = !["REFUNDED", "CANCELLED", "REJECTED"].includes(
    returnRequest.status,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
            <RotateCcw className="h-7 w-7 text-[#CC785C]" />
            {returnRequest.returnNumber}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={getStatusVariant(returnRequest.status)}>
              {returnRequest.status}
            </Badge>
            <span className="text-sm text-[#736B66]">
              สร้างเมื่อ{" "}
              {new Date(returnRequest.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canApprove && (
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="bg-[#CC785C] text-white hover:bg-[#B86548]"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Approve
            </Button>
          )}
          {canReject && (
            <Button
              variant="outline"
              onClick={() => setRejectOpen(true)}
              disabled={submitting}
              className="border-[#E8E0D5] text-destructive hover:bg-[#F5F0E8]"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          )}
          {canReceive && (
            <Button
              onClick={handleReceive}
              disabled={submitting}
              className="bg-[#D4A574] text-white hover:bg-[#B88A5C]"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PackageCheck className="mr-2 h-4 w-4" />
              )}
              Mark Received
            </Button>
          )}
          {canRefund && (
            <Button
              onClick={() => setRefundOpen(true)}
              disabled={submitting}
              className="bg-[#CC785C] text-white hover:bg-[#B86548]"
            >
              <Banknote className="mr-2 h-4 w-4" />
              Process Refund
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setCancelOpen(true)}
              disabled={submitting}
              className="border-[#E8E0D5] text-[#736B66] hover:bg-[#F5F0E8]"
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[#2D2825] font-medium">
              {returnRequest.customerName ?? "—"}
            </div>
            <div className="text-xs text-[#736B66]">
              {returnRequest.customerEmail}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/merchant/orders`}
              className="text-[#CC785C] hover:underline font-mono text-sm inline-flex items-center gap-1"
            >
              #{returnRequest.orderId.substring(0, 8)}
              <ExternalLink className="h-3 w-3" />
            </Link>
            {returnRequest.shipmentNumber && (
              <div className="text-xs text-[#736B66] mt-1">
                Shipment: {returnRequest.shipmentNumber}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[#2D2825] font-medium">
              {returnRequest.reason.replace(/_/g, " ")}
            </div>
            {returnRequest.reasonNote && (
              <div className="text-xs text-[#736B66] mt-1 line-clamp-2">
                {returnRequest.reasonNote}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Refund
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[#2D2825] font-bold text-xl">
              ฿
              {returnRequest.refundAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-xs text-[#736B66] mt-1">
              {returnRequest.refundMethod.replace(/_/g, " ")}
              {returnRequest.refundedAt &&
                ` · ${new Date(returnRequest.refundedAt).toLocaleDateString()}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader>
          <CardTitle className="text-[#2D2825]">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#E8E0D5] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F0E8] hover:bg-[#F5F0E8]">
                  <TableHead className="text-[#736B66]">Product</TableHead>
                  <TableHead className="text-[#736B66]">SKU</TableHead>
                  <TableHead className="text-right text-[#736B66]">
                    Qty Returned
                  </TableHead>
                  <TableHead className="text-right text-[#736B66]">
                    Unit Price
                  </TableHead>
                  <TableHead className="text-right text-[#736B66]">
                    Subtotal
                  </TableHead>
                  <TableHead className="text-[#736B66]">Restock</TableHead>
                  <TableHead className="text-[#736B66]">Condition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnRequest.items.map((it) => (
                  <TableRow key={it.id} className="hover:bg-[#F5F0E8]/40">
                    <TableCell className="text-[#2D2825]">
                      {it.productName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#736B66]">
                      {it.productSku}
                    </TableCell>
                    <TableCell className="text-right text-[#2D2825]">
                      {it.quantity} / {it.orderedQuantity}
                    </TableCell>
                    <TableCell className="text-right text-[#2D2825]">
                      ฿
                      {it.unitPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-[#2D2825] font-medium">
                      ฿
                      {it.subTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      {it.restock ? (
                        <Badge variant="info">Yes</Badge>
                      ) : (
                        <Badge variant="default">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-[#736B66]">
                      {it.conditionNote ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {returnRequest.restocked && (
            <div className="mt-3 text-xs text-[#736B66]">
              <CheckCircle2 className="inline h-3 w-3 mr-1 text-[#D4A574]" />
              Items ที่ทำเครื่องหมาย restock ได้ถูกคืนเข้าสต็อกเรียบร้อย
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes / Timeline */}
      {(returnRequest.notes || returnRequest.reviewedAt) && (
        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader>
            <CardTitle className="text-[#2D2825]">Notes &amp; Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {returnRequest.notes && (
              <div>
                <div className="text-xs text-[#736B66] uppercase font-semibold">
                  Notes
                </div>
                <div className="text-[#2D2825] whitespace-pre-wrap">
                  {returnRequest.notes}
                </div>
              </div>
            )}
            {returnRequest.reviewedAt && (
              <div className="text-xs text-[#736B66]">
                Reviewed by {returnRequest.reviewedByName ?? "system"} on{" "}
                {new Date(returnRequest.reviewedAt).toLocaleString()}
              </div>
            )}
            {returnRequest.receivedAt && (
              <div className="text-xs text-[#736B66]">
                Received on{" "}
                {new Date(returnRequest.receivedAt).toLocaleString()}
              </div>
            )}
            {returnRequest.refundedAt && (
              <div className="text-xs text-[#736B66]">
                Refunded on{" "}
                {new Date(returnRequest.refundedAt).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="bg-white border-[#E8E0D5]">
          <DialogHeader>
            <DialogTitle className="text-[#2D2825]">Reject Return</DialogTitle>
            <DialogDescription className="text-[#736B66]">
              ระบุเหตุผลในการปฏิเสธคำขอคืนนี้
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="เหตุผลในการปฏิเสธ"
            className="border-[#E8E0D5] min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={submitting}
              className="border-[#E8E0D5] text-[#2D2825]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={submitting || !rejectReason.trim()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="bg-white border-[#E8E0D5]">
          <DialogHeader>
            <DialogTitle className="text-[#2D2825]">Process Refund</DialogTitle>
            <DialogDescription className="text-[#736B66]">
              ยืนยันยอดเงินที่จะคืนให้ลูกค้า (
              {returnRequest.refundMethod.replace(/_/g, " ")})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-[#2D2825]">Refund Amount (฿)</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="border-[#E8E0D5]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundOpen(false)}
              disabled={submitting}
              className="border-[#E8E0D5] text-[#2D2825]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              disabled={submitting}
              className="bg-[#CC785C] text-white hover:bg-[#B86548]"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Banknote className="mr-2 h-4 w-4" />
              )}
              Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="bg-white border-[#E8E0D5]">
          <DialogHeader>
            <DialogTitle className="text-[#2D2825]">Cancel Return</DialogTitle>
            <DialogDescription className="text-[#736B66]">
              ยกเลิกคำขอคืนนี้ (ไม่สามารถย้อนกลับได้)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            placeholder="หมายเหตุการยกเลิก (optional)"
            className="border-[#E8E0D5] min-h-[80px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={submitting}
              className="border-[#E8E0D5] text-[#2D2825]"
            >
              Back
            </Button>
            <Button
              onClick={handleCancel}
              disabled={submitting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
