"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Truck } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createShipment,
  type ShippableOrder,
} from "@/server/actions/shipments";

interface CarrierOption {
  id: string;
  name: string;
  code: string;
}

interface CreateShipmentDialogProps {
  shippableOrders: ShippableOrder[];
  carriers: CarrierOption[];
}

interface ItemSelection {
  orderItemId: string;
  quantity: number;
  remaining: number;
  productName: string;
  productSku: string;
}

export function CreateShipmentDialog({
  shippableOrders,
  carriers,
}: CreateShipmentDialogProps): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const [orderId, setOrderId] = useState<string>("");
  const [carrierId, setCarrierId] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCost, setShippingCost] = useState<string>("0");
  const [weightKg, setWeightKg] = useState<string>("0");
  const [shipToName, setShipToName] = useState("");
  const [shipToPhone, setShipToPhone] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [shipToCity, setShipToCity] = useState("");
  const [shipToPostal, setShipToPostal] = useState("");
  const [shipToCountry, setShipToCountry] = useState("Thailand");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemSelection[]>([]);

  const selectedOrder = useMemo(
    () => shippableOrders.find((o) => o.id === orderId) ?? null,
    [shippableOrders, orderId]
  );

  // เมื่อเลือก order ใหม่ → reset items และ prefill ที่อยู่จาก customer profile
  function handleSelectOrder(id: string) {
    setOrderId(id);
    const order = shippableOrders.find((o) => o.id === id);
    if (!order) {
      setItems([]);
      return;
    }
    setItems(
      order.items
        .filter((it) => it.remainingQuantity > 0)
        .map((it) => ({
          orderItemId: it.orderItemId,
          quantity: it.remainingQuantity,
          remaining: it.remainingQuantity,
          productName: it.productName,
          productSku: it.productSku,
        }))
    );
    if (order.customerName && !shipToName) setShipToName(order.customerName);
    if (order.shippingAddress && !shipToAddress) {
      setShipToAddress(order.shippingAddress);
    }
  }

  function updateItemQuantity(orderItemId: string, qty: number) {
    setItems((prev) =>
      prev.map((it) =>
        it.orderItemId === orderItemId
          ? { ...it, quantity: Math.max(0, Math.min(qty, it.remaining)) }
          : it
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!orderId) {
      setServerError("กรุณาเลือก order");
      return;
    }
    if (!shipToName.trim() || !shipToAddress.trim()) {
      setServerError("กรุณากรอกชื่อและที่อยู่ผู้รับ");
      return;
    }
    const itemsToShip = items.filter((it) => it.quantity > 0);
    if (itemsToShip.length === 0) {
      setServerError("ต้องเลือกอย่างน้อย 1 รายการที่จะส่ง");
      return;
    }

    setSubmitting(true);
    const res = await createShipment({
      orderId,
      carrierId: carrierId || null,
      trackingNumber: trackingNumber || null,
      shippingCost: Number(shippingCost) || 0,
      weightKg: Number(weightKg) || 0,
      shipToName: shipToName.trim(),
      shipToPhone: shipToPhone || null,
      shipToAddress: shipToAddress.trim(),
      shipToCity: shipToCity || null,
      shipToPostal: shipToPostal || null,
      shipToCountry: shipToCountry || null,
      notes: notes || null,
      items: itemsToShip.map((it) => ({
        orderItemId: it.orderItemId,
        quantity: it.quantity,
      })),
    });
    setSubmitting(false);

    if (res.error) {
      setServerError(res.error);
      return;
    }

    // reset form
    setOrderId("");
    setCarrierId("");
    setTrackingNumber("");
    setShippingCost("0");
    setWeightKg("0");
    setShipToName("");
    setShipToPhone("");
    setShipToAddress("");
    setShipToCity("");
    setShipToPostal("");
    setShipToCountry("Thailand");
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
          New Shipment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-white border-[#E8E0D5] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <Truck className="h-5 w-5 text-[#CC785C]" />
            Create New Shipment
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            สร้าง shipment ขาออกจาก order ที่พร้อมจัดส่ง
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-[#2D2825]">Order</Label>
            <Select value={orderId} onValueChange={handleSelectOrder}>
              <SelectTrigger className="border-[#E8E0D5]">
                <SelectValue placeholder="เลือก order ที่จะจัดส่ง" />
              </SelectTrigger>
              <SelectContent>
                {shippableOrders.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-[#736B66]">
                    ไม่มี order ที่พร้อมจัดส่ง
                  </div>
                ) : (
                  shippableOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      #{o.id.substring(0, 8)} · {o.customerName ?? o.customerEmail}{" "}
                      · ฿{o.totalAmount.toLocaleString()}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedOrder && (
            <div className="border border-[#E8E0D5] rounded-md p-3 bg-[#F5F0E8]/40 space-y-2">
              <div className="text-xs font-semibold text-[#736B66] uppercase">
                Items to Ship
              </div>
              {items.length === 0 ? (
                <div className="text-sm text-[#736B66]">
                  Order นี้ ship ครบแล้ว
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((it) => (
                    <div
                      key={it.orderItemId}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex-1">
                        <div className="text-[#2D2825] font-medium">
                          {it.productName}
                        </div>
                        <div className="text-xs text-[#736B66] font-mono">
                          {it.productSku} · เหลือต้องส่ง {it.remaining}
                        </div>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={it.remaining}
                        value={it.quantity}
                        onChange={(e) =>
                          updateItemQuantity(
                            it.orderItemId,
                            parseInt(e.target.value || "0", 10)
                          )
                        }
                        className="w-20 border-[#E8E0D5]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Carrier</Label>
              <Select value={carrierId} onValueChange={setCarrierId}>
                <SelectTrigger className="border-[#E8E0D5]">
                  <SelectValue placeholder="เลือกผู้ขนส่ง (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {carriers.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-[#736B66]">
                      ยังไม่มี carrier — เพิ่มที่หน้า Carriers
                    </div>
                  ) : (
                    carriers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Tracking Number</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="THXXXX1234"
                className="border-[#E8E0D5]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Shipping Cost (฿)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                className="border-[#E8E0D5]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Weight (kg)</Label>
              <Input
                type="number"
                min={0}
                step="0.001"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="border-[#E8E0D5]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#2D2825]">Recipient Name</Label>
            <Input
              value={shipToName}
              onChange={(e) => setShipToName(e.target.value)}
              placeholder="ชื่อผู้รับ"
              className="border-[#E8E0D5]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Phone</Label>
              <Input
                value={shipToPhone}
                onChange={(e) => setShipToPhone(e.target.value)}
                placeholder="08X-XXX-XXXX"
                className="border-[#E8E0D5]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#2D2825]">City</Label>
              <Input
                value={shipToCity}
                onChange={(e) => setShipToCity(e.target.value)}
                placeholder="Bangkok"
                className="border-[#E8E0D5]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#2D2825]">Address</Label>
            <Textarea
              rows={2}
              value={shipToAddress}
              onChange={(e) => setShipToAddress(e.target.value)}
              placeholder="ที่อยู่จัดส่ง"
              className="border-[#E8E0D5]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Postal Code</Label>
              <Input
                value={shipToPostal}
                onChange={(e) => setShipToPostal(e.target.value)}
                placeholder="10110"
                className="border-[#E8E0D5]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Country</Label>
              <Input
                value={shipToCountry}
                onChange={(e) => setShipToCountry(e.target.value)}
                className="border-[#E8E0D5]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#2D2825]">Notes</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุภายใน (optional)"
              className="border-[#E8E0D5]"
            />
          </div>

          {serverError && (
            <div className="text-sm font-medium text-destructive p-3 bg-destructive/10 rounded-md">
              {serverError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || shippableOrders.length === 0}
              className="bg-[#CC785C] text-white hover:bg-[#B86548]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Shipment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
