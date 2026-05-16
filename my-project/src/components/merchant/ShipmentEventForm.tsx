"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import type { ShipmentEventType } from "@prisma/client";

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
import { addShipmentEvent } from "@/server/actions/shipments";

interface ShipmentEventFormProps {
  shipmentId: string;
}

const EVENT_TYPES: { value: ShipmentEventType; label: string }[] = [
  { value: "NOTE", label: "Note" },
  { value: "PICKED_UP", label: "Picked Up" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "ARRIVED_AT_HUB", label: "Arrived at Hub" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERY_ATTEMPTED", label: "Delivery Attempted" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed" },
  { value: "RETURNED", label: "Returned" },
];

export function ShipmentEventForm({
  shipmentId,
}: ShipmentEventFormProps): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [type, setType] = useState<ShipmentEventType>("NOTE");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!message.trim()) {
      setError("Message is required.");
      return;
    }
    setSubmitting(true);
    const res = await addShipmentEvent({
      shipmentId,
      type,
      message: message.trim(),
      location: location || null,
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setType("NOTE");
    setMessage("");
    setLocation("");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-[#E8E0D5] text-[#CC785C] hover:bg-[#F5F0E8] h-7 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="text-[#2D2825]">Add Tracking Event</DialogTitle>
          <DialogDescription className="text-[#736B66]">
            บันทึกเหตุการณ์ลงใน timeline ของ shipment นี้
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#2D2825]">Event Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as ShipmentEventType)}
            >
              <SelectTrigger className="border-[#E8E0D5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[#2D2825]">Message</Label>
            <Textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Package arrived at Bangkok hub"
              className="border-[#E8E0D5]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#2D2825]">Location (optional)</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bangkok"
              className="border-[#E8E0D5]"
            />
          </div>
          {error && (
            <div className="text-sm font-medium text-destructive p-2 bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="border-[#E8E0D5] text-[#2D2825]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#CC785C] text-white hover:bg-[#B86548]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
