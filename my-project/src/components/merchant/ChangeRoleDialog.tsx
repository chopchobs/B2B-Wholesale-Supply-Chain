"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  updateUserRole,
  type UserListItem,
  type UserDetail,
} from "@/server/actions/users";

interface ChangeRoleDialogProps {
  user: UserListItem | UserDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ลำดับสิทธิ์: ADMIN > MERCHANT > VIP_CLIENT > USER
const RANK: Record<Role, number> = {
  ADMIN: 4,
  MERCHANT: 3,
  VIP_CLIENT: 2,
  USER: 1,
};

export function ChangeRoleDialog(
  props: ChangeRoleDialogProps
): React.ReactElement {
  const { user, open, onOpenChange } = props;
  const router = useRouter();
  // sync state จาก user.id โดยใช้ derived state pattern (หลีกเลี่ยง setState ใน useEffect)
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Role>(Role.USER);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  if (user && user.id !== lastUserId) {
    setLastUserId(user.id);
    setSelected(user.role);
    setServerError(null);
  }

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-white border-[#E8E0D5]" />
      </Dialog>
    );
  }

  const isDowngrade = RANK[selected] < RANK[user.role];
  const isSame = selected === user.role;

  async function handleSubmit() {
    if (!user) return;
    setServerError(null);
    setSubmitting(true);
    const res = await updateUserRole(user.id, selected);
    setSubmitting(false);
    if (res.error) {
      setServerError(res.error);
      return;
    }
    onOpenChange(false);
    startTransition(() => router.refresh());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <ShieldCheck className="h-5 w-5 text-[#CC785C]" />
            Change Role
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            เปลี่ยน role ของ{" "}
            <span className="font-semibold text-[#2D2825]">
              {user.name ?? user.email}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-[#2D2825]">New Role</Label>
            <Select
              value={selected}
              onValueChange={(v) => setSelected(v as Role)}
            >
              <SelectTrigger className="bg-white border-[#E8E0D5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                <SelectItem value={Role.MERCHANT}>Merchant</SelectItem>
                <SelectItem value={Role.VIP_CLIENT}>VIP Client</SelectItem>
                <SelectItem value={Role.USER}>Buyer (User)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm rounded-md p-3 bg-[#F5F0E8] border border-[#E8E0D5] text-[#736B66]">
            <span className="text-[#2D2825] font-medium">Current:</span>{" "}
            {user.role}
            <span className="mx-2">→</span>
            <span className="text-[#2D2825] font-medium">New:</span> {selected}
          </div>

          {isDowngrade && (
            <div className="flex items-start gap-2 text-sm rounded-md p-3 bg-amber-50 border border-amber-200 text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <strong>Warning:</strong> นี่คือการลดสิทธิ์ (downgrade) —
                user อาจไม่สามารถเข้าถึงฟีเจอร์เดิมได้อีกต่อไป
              </span>
            </div>
          )}

          {serverError && (
            <div className="text-sm font-medium text-destructive p-3 bg-destructive/10 rounded-md">
              {serverError}
            </div>
          )}
        </div>

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
            disabled={submitting || isSame}
            className="bg-[#CC785C] text-white hover:bg-[#B86548]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Confirm Change"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
