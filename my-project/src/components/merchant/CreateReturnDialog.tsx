"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, RotateCcw } from "lucide-react";
import type { ReturnReason, RefundMethod } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createReturnRequest,
  type ReturnableOrder,
} from "@/server/actions/returns";

interface CreateReturnDialogProps {
  returnableOrders: ReturnableOrder[];
}

interface ItemSelection {
  orderItemId: string;
  quantity: number;
  returnable: number;
  productName: string;
  productSku: string;
  unitPrice: number;
  restock: boolean;
  conditionNote: string;
  // ติ๊กเลือกว่าจะใส่ใน RMA หรือไม่
  selected: boolean;
}

const REASON_OPTIONS: { value: ReturnReason; label: string }[] = [
  { value: "DAMAGED", label: "Damaged" },
  { value: "DEFECTIVE", label: "Defective" },
  { value: "WRONG_ITEM", label: "Wrong Item" },
  { value: "NOT_AS_DESCRIBED", label: "Not as Described" },
  { value: "CUSTOMER_CHANGED_MIND", label: "Customer Changed Mind" },
  { value: "OTHER", label: "Other" },
];

const REFUND_METHOD_OPTIONS: { value: RefundMethod; label: string }[] = [
  { value: "ORIGINAL_PAYMENT", label: "Original Payment" },
  { value: "STORE_CREDIT", label: "Store Credit" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH", label: "Cash" },
];

export function CreateReturnDialog({
  returnableOrders,
}: CreateReturnDialogProps): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const [orderId, setOrderId] = useState<string>("");
  const [shipmentId, setShipmentId] = useState<string>("");
  const [reason, setReason] = useState<ReturnReason>("DAMAGED");
  const [reasonNote, setReasonNote] = useState("");
  const [refundMethod, setRefundMethod] =
    useState<RefundMethod>("ORIGINAL_PAYMENT");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemSelection[]>([]);

  const selectedOrder = useMemo(
    () => returnableOrders.find((o) => o.id === orderId) ?? null,
    [returnableOrders, orderId],
  );

  // คำนวณยอด refund รวมแบบ live จาก items ที่ถูกเลือก
  const refundPreview = useMemo(() => {
    return items
      .filter((it) => it.selected && it.quantity > 0)
      .reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  }, [items]);

  // เมื่อเลือก order ใหม่ → reset items ตาม returnable quantity
  function handleSelectOrder(id: string) {
    setOrderId(id);
    setShipmentId("");
    const order = returnableOrders.find((o) => o.id === id);
    if (!order) {
      setItems([]);
      return;
    }
    setItems(
      order.items
        .filter((it) => it.returnableQuantity > 0)
        .map((it) => ({
          orderItemId: it.orderItemId,
          quantity: it.returnableQuantity,
          returnable: it.returnableQuantity,
          productName: it.productName,
          productSku: it.productSku,
          unitPrice: it.unitPrice,
          restock: true,
          conditionNote: "",
          selected: true,
        })),
    );
  }

  function updateItem<K extends keyof ItemSelection>(
    orderItemId: string,
    key: K,
    value: ItemSelection[K],
  ) {
    setItems((prev) =>
      prev.map((it) =>
        it.orderItemId === orderItemId ? { ...it, [key]: value } : it,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!orderId) {
      setServerError("กรุณาเลือก order");
      return;
    }
    if (!selectedOrder) return;

    const itemsToReturn = items.filter((it) => it.selected && it.quantity > 0);
    if (itemsToReturn.length === 0) {
      setServerError("ต้องเลือกอย่างน้อย 1 รายการที่จะคืน");
      return;
    }

    setSubmitting(true);
    const res = await createReturnRequest({
      orderId,
      shipmentId: shipmentId || null,
      requestedById: selectedOrder.customerUserId,
      reason,
      reasonNote: reasonNote.trim() || null,
      refundMethod,
      notes: notes.trim() || null,
      items: itemsToReturn.map((it) => ({
        orderItemId: it.orderItemId,
        quantity: it.quantity,
        restock: it.restock,
        conditionNote: it.conditionNote.trim() || null,
      })),
    });
    setSubmitting(false);

    if (res.error) {
      setServerError(res.error);
      return;
    }

    // reset form
    setOrderId("");
    setShipmentId("");
    setReason("DAMAGED");
    setReasonNote("");
    setRefundMethod("ORIGINAL_PAYMENT");
    setNotes("");
    setItems([]);
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#CC785C] text-white hover:bg-[#B86548]">
          <Plus className="mr-2 h-4 w-4" />
          New Return
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-white border-[#E8E0D5] max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <RotateCcw className="h-5 w-5 text-[#CC785C]" />
            Create Return Request
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            สร้างคำขอคืนสินค้า (RMA) จาก order ที่จัดส่งแล้ว
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-[#2D2825]">Order</Label>
            <Select value={orderId} onValueChange={handleSelectOrder}>
              <SelectTrigger className="border-[#E8E0D5]">
                <SelectValue placeholder="เลือก order ที่จะขอคืน" />
              </SelectTrigger>
              <SelectContent>
                {returnableOrders.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-[#736B66]">
                    ไม่มี order ที่คืนได้
                  </div>
                ) : (
                  returnableOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      #{o.id.substring(0, 8)} ·{" "}
                      {o.customerName ?? o.customerEmail} · ฿
                      {o.totalAmount.toLocaleString()}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedOrder && selectedOrder.shipments.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[#2D2825]">
                Related Shipment{" "}
                <span className="text-xs text-[#736B66]">(optional)</span>
              </Label>
              <Select
                value={shipmentId}
                onValueChange={(v) => setShipmentId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="border-[#E8E0D5]">
                  <SelectValue placeholder="เลือก shipment (ถ้ามี)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— ไม่ระบุ —</SelectItem>
                  {selectedOrder.shipments.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.shipmentNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedOrder && (
            <div className="border border-[#E8E0D5] rounded-md p-3 bg-[#F5F0E8]/40 space-y-3">
              <div className="text-xs font-semibold text-[#736B66] uppercase">
                Items to Return
              </div>
              {items.length === 0 ? (
                <div className="text-sm text-[#736B66]">
                  ไม่มีรายการที่คืนได้ใน order นี้
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((it) => (
                    <div
                      key={it.orderItemId}
                      className="rounded-md border border-[#E8E0D5] bg-white p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <Checkbox
                            checked={it.selected}
                            onCheckedChange={(v) =>
                              updateItem(it.orderItemId, "selected", v === true)
                            }
                            className="mt-1 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[#2D2825] font-medium text-sm break-words">
                              {it.productName}
                            </div>
                            <div className="text-xs text-[#736B66] font-mono break-all">
                              {it.productSku} · คืนได้ {it.returnable} · ฿
                              {it.unitPrice.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                              /หน่วย
                            </div>
                          </div>
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={it.returnable}
                          value={it.quantity}
                          disabled={!it.selected}
                          onChange={(e) =>
                            updateItem(
                              it.orderItemId,
                              "quantity",
                              Math.max(
                                0,
                                Math.min(
                                  parseInt(e.target.value || "0", 10),
                                  it.returnable,
                                ),
                              ),
                            )
                          }
                          className="w-20 shrink-0 border-[#E8E0D5]"
                        />
                      </div>
                      {it.selected && (
                        <div className="flex items-center gap-3 pl-6 flex-wrap">
                          <label className="flex items-center gap-2 text-xs text-[#736B66] cursor-pointer">
                            <Checkbox
                              checked={it.restock}
                              onCheckedChange={(v) =>
                                updateItem(
                                  it.orderItemId,
                                  "restock",
                                  v === true,
                                )
                              }
                            />
                            Restock เข้า inventory
                          </label>
                          <Input
                            value={it.conditionNote}
                            onChange={(e) =>
                              updateItem(
                                it.orderItemId,
                                "conditionNote",
                                e.target.value,
                              )
                            }
                            placeholder="หมายเหตุสภาพ (optional)"
                            className="flex-1 min-w-[160px] h-8 text-xs border-[#E8E0D5]"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-sm border-t border-[#E8E0D5] pt-2">
                <span className="text-[#736B66]">Refund Preview</span>
                <span className="font-semibold text-[#CC785C]">
                  ฿
                  {refundPreview.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Reason</Label>
              <Select
                value={reason}
                onValueChange={(v) => setReason(v as ReturnReason)}
              >
                <SelectTrigger className="border-[#E8E0D5]">
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
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Refund Method</Label>
              <Select
                value={refundMethod}
                onValueChange={(v) => setRefundMethod(v as RefundMethod)}
              >
                <SelectTrigger className="border-[#E8E0D5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFUND_METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#2D2825]">Reason Detail</Label>
            <Textarea
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder="รายละเอียดเหตุผลที่ขอคืน"
              className="border-[#E8E0D5] min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#2D2825]">
              Internal Notes{" "}
              <span className="text-xs text-[#736B66]">(optional)</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุภายใน"
              className="border-[#E8E0D5] min-h-[60px]"
            />
          </div>

          {serverError && (
            <div className="rounded-md p-3 bg-destructive/10 text-destructive text-sm">
              {serverError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-[#E8E0D5] text-[#2D2825]"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#CC785C] text-white hover:bg-[#B86548]"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Return"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
