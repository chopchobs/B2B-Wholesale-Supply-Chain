"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  X,
  Loader2,
  UserPlus,
  Clock,
  Inbox,
} from "lucide-react";
import {
  approveUser,
  rejectUser,
  type PendingApprovalItem,
} from "@/server/actions/users";

interface ApprovalQueueClientProps {
  approvals: PendingApprovalItem[];
  adminId: string;
}

function roleBadge(role: Role): "secondary" | "info" | "warning" | "vip" {
  switch (role) {
    case Role.ADMIN:
      return "warning";
    case Role.MERCHANT:
      return "info";
    case Role.VIP_CLIENT:
      return "vip";
    default:
      return "secondary";
  }
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApprovalQueueClient(
  props: ApprovalQueueClientProps
): React.ReactElement {
  const { approvals, adminId } = props;
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  function setNote(userId: string, value: string): void {
    setNotes((prev) => ({ ...prev, [userId]: value }));
  }

  async function handleApprove(userId: string): Promise<void> {
    setBusyId(userId);
    setErrors((p) => ({ ...p, [userId]: "" }));
    const res = await approveUser(userId, adminId, notes[userId]);
    setBusyId(null);
    if (res.error) {
      setErrors((p) => ({ ...p, [userId]: res.error ?? "Failed." }));
      return;
    }
    setNote(userId, "");
    startTransition(() => router.refresh());
  }

  async function handleReject(userId: string): Promise<void> {
    const note = notes[userId]?.trim();
    if (!note) {
      setErrors((p) => ({
        ...p,
        [userId]: "กรุณาระบุเหตุผลก่อนปฏิเสธ",
      }));
      return;
    }
    setBusyId(userId);
    setErrors((p) => ({ ...p, [userId]: "" }));
    const res = await rejectUser(userId, adminId, note);
    setBusyId(null);
    if (res.error) {
      setErrors((p) => ({ ...p, [userId]: res.error ?? "Failed." }));
      return;
    }
    setNote(userId, "");
    startTransition(() => router.refresh());
  }

  if (approvals.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-dashed border-[#E8E0D5]">
        <Inbox className="mx-auto h-12 w-12 text-[#D4A574] mb-3" />
        <h3 className="text-lg font-medium text-[#2D2825]">
          ไม่มี approval ที่รอดำเนินการ
        </h3>
        <p className="text-[#736B66] text-sm">
          ทุก user ใหม่ได้รับการรีวิวเรียบร้อยแล้ว
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {approvals.map((a) => {
        const isBusy = busyId === a.userId;
        const noteValue = notes[a.userId] ?? "";
        const err = errors[a.userId];
        return (
          <Card
            key={a.approvalId}
            className="bg-white border-[#E8E0D5]"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-2">
                <Link
                  href={`/merchant/users/${a.userId}`}
                  className="flex items-center gap-2 text-[#2D2825] hover:text-[#CC785C]"
                >
                  <UserPlus className="h-5 w-5 text-[#CC785C]" />
                  <span className="text-base font-semibold">
                    {a.userName ?? a.userEmail}
                  </span>
                </Link>
                <Badge variant={roleBadge(a.role)}>{a.role}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-[#736B66] space-y-1">
                <div>
                  <span className="text-[#2D2825] font-medium">Email:</span>{" "}
                  {a.userEmail}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  Requested {formatDate(a.requestedAt)}
                </div>
              </div>

              <Textarea
                rows={2}
                placeholder="ระบุหมายเหตุ (จำเป็นเมื่อ reject)"
                value={noteValue}
                onChange={(e) => setNote(a.userId, e.target.value)}
                disabled={isBusy}
                className="bg-white border-[#E8E0D5]"
              />

              {err && (
                <div className="text-xs font-medium text-destructive p-2 bg-destructive/10 rounded">
                  {err}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => handleApprove(a.userId)}
                  disabled={isBusy}
                  className="flex-1 bg-[#CC785C] text-white hover:bg-[#B86548]"
                >
                  {isBusy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleReject(a.userId)}
                  disabled={isBusy}
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
