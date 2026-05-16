"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApprovalStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Power, PowerOff, Loader2 } from "lucide-react";
import {
  suspendUser,
  activateUser,
  type UserDetail,
} from "@/server/actions/users";
import { ChangeRoleDialog } from "@/components/merchant/ChangeRoleDialog";

interface UserDetailClientProps {
  user: UserDetail;
}

export function UserDetailClient(
  props: UserDetailClientProps
): React.ReactElement {
  const { user } = props;
  const router = useRouter();
  const [roleOpen, setRoleOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function handleToggle(): Promise<void> {
    setBusy(true);
    const res = user.isActive
      ? await suspendUser(user.id)
      : await activateUser(user.id);
    setBusy(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  const pendingApproval =
    user.latestApprovalStatus === ApprovalStatus.PENDING;

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRoleOpen(true)}
          disabled={busy}
          className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
        >
          <ShieldCheck className="mr-2 h-4 w-4 text-[#CC785C]" />
          Change Role
        </Button>

        <Button
          type="button"
          onClick={handleToggle}
          disabled={busy || pendingApproval}
          className={
            user.isActive
              ? "bg-destructive text-white hover:bg-destructive/90"
              : "bg-[#CC785C] text-white hover:bg-[#B86548]"
          }
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : user.isActive ? (
            <PowerOff className="mr-2 h-4 w-4" />
          ) : (
            <Power className="mr-2 h-4 w-4" />
          )}
          {user.isActive ? "Suspend" : "Activate"}
        </Button>
      </div>

      <ChangeRoleDialog
        user={user}
        open={roleOpen}
        onOpenChange={setRoleOpen}
      />
    </>
  );
}
