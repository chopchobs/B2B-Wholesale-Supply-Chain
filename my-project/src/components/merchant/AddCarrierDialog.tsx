"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Building2 } from "lucide-react";

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
import { createCarrier } from "@/server/actions/carriers";

export function AddCarrierDialog(): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !code.trim()) {
      setError("ต้องระบุ name และ code");
      return;
    }
    setSubmitting(true);
    const res = await createCarrier({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      trackingUrl: trackingUrl || null,
      contactName: contactName || null,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      notes: notes || null,
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setName("");
    setCode("");
    setTrackingUrl("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setNotes("");
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#CC785C] text-white hover:bg-[#B86548]">
          <Plus className="mr-2 h-4 w-4" />
          Add Carrier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="text-[#2D2825] flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#CC785C]" />
            Add Carrier
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            เพิ่มผู้ให้บริการขนส่งใหม่
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kerry Express"
                className="border-[#E8E0D5]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="KERRY"
                className="border-[#E8E0D5] font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#2D2825]">Tracking URL Template</Label>
            <Input
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://carrier.com/track?n={TRACKING}"
              className="border-[#E8E0D5]"
            />
            <p className="text-xs text-[#736B66]">
              ใช้ <code className="bg-[#F5F0E8] px-1 rounded">{"{TRACKING}"}</code>{" "}
              เป็น placeholder
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Contact Person</Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="border-[#E8E0D5]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Phone</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="border-[#E8E0D5]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#2D2825]">Email</Label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="ops@carrier.com"
              className="border-[#E8E0D5]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#2D2825]">Notes</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-[#E8E0D5]"
            />
          </div>

          {error && (
            <div className="text-sm font-medium text-destructive p-3 bg-destructive/10 rounded-md">
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
                  Saving...
                </>
              ) : (
                "Save Carrier"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
