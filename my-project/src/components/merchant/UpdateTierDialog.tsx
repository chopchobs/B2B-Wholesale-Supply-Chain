"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CustomerTier } from "@prisma/client";
import { Crown, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  updateAccountTier,
  type CustomerListItem,
  type CustomerDetail,
} from "@/server/actions/customers";

interface UpdateTierDialogProps {
  customer: CustomerListItem | CustomerDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TierOption {
  value: CustomerTier;
  label: string;
  description: string;
  variant: "secondary" | "info" | "warning" | "vip";
}

const TIER_OPTIONS: TierOption[] = [
  {
    value: CustomerTier.BRONZE,
    label: "Bronze",
    description: "ลูกค้าใหม่ — ราคา retail มาตรฐาน, ไม่มี credit",
    variant: "secondary",
  },
  {
    value: CustomerTier.SILVER,
    label: "Silver",
    description: "ลูกค้าประจำ — ส่วนลด 5%, credit term net 15",
    variant: "info",
  },
  {
    value: CustomerTier.GOLD,
    label: "Gold",
    description: "ลูกค้า VIP — ส่วนลด 10%, credit term net 30, priority support",
    variant: "warning",
  },
  {
    value: CustomerTier.PLATINUM,
    label: "Platinum",
    description:
      "พรีเมียมพาร์ทเนอร์ — ส่วนลดสูงสุด 15%, credit term net 45, dedicated AM",
    variant: "vip",
  },
];

export function UpdateTierDialog(
  props: UpdateTierDialogProps
): React.ReactElement {
  const { customer, open, onOpenChange } = props;
  const router = useRouter();
  // ใช้ key เป็นตัวบังคับ remount เพื่อ reset state เมื่อเปลี่ยน customer
  const dialogKey = `${customer?.id ?? "none"}-${open ? "open" : "closed"}`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <UpdateTierDialogBody
        key={dialogKey}
        customer={customer}
        onOpenChange={onOpenChange}
        router={router}
      />
    </Dialog>
  );
}

interface UpdateTierDialogBodyProps {
  customer: CustomerListItem | CustomerDetail | null;
  onOpenChange: (open: boolean) => void;
  router: ReturnType<typeof useRouter>;
}

function UpdateTierDialogBody(
  props: UpdateTierDialogBodyProps
): React.ReactElement {
  const { customer, onOpenChange, router } = props;
  const [selected, setSelected] = useState<CustomerTier>(
    customer?.accountTier ?? CustomerTier.BRONZE
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function handleSubmit() {
    if (!customer) return;
    setServerError(null);
    setSubmitting(true);
    const res = await updateAccountTier(customer.id, selected);
    setSubmitting(false);
    if (res.error) {
      setServerError(res.error);
      return;
    }
    onOpenChange(false);
    startTransition(() => router.refresh());
  }

  return (
    <DialogContent className="sm:max-w-lg bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <Crown className="h-5 w-5 text-[#D4A574]" />
            Update Account Tier
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            เลือก tier ใหม่สำหรับ{" "}
            <span className="font-semibold text-[#2D2825]">
              {customer?.companyName ?? "-"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {TIER_OPTIONS.map((opt) => {
            const active = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={`w-full text-left rounded-lg border p-3 transition-all ${
                  active
                    ? "border-[#CC785C] bg-[#F5F0E8] ring-1 ring-[#CC785C]"
                    : "border-[#E8E0D5] bg-white hover:bg-[#F5F0E8]/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={opt.variant}>{opt.label}</Badge>
                  {customer?.accountTier === opt.value && (
                    <span className="text-xs text-[#736B66]">Current</span>
                  )}
                </div>
                <p className="text-sm text-[#2D2825] mt-2">
                  {opt.description}
                </p>
              </button>
            );
          })}
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
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selected === customer?.accountTier}
            className="bg-[#CC785C] text-white hover:bg-[#B86548]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Tier"
            )}
          </Button>
        </DialogFooter>
    </DialogContent>
  );
}
