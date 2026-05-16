import React from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPendingApprovals } from "@/server/actions/users";
import { ApprovalQueueClient } from "@/components/merchant/ApprovalQueueClient";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const approvalsRes = await getPendingApprovals();
  const approvals = approvalsRes.data ?? [];
  const loadError = approvalsRes.error;

  // หาก user ยังไม่ login ใช้ id เปล่าและ disable การกระทำ
  const adminId = user?.id ?? "";

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      <div className="flex items-center gap-2">
        <Link href="/merchant/users">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Users
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
          <ClipboardCheck className="h-7 w-7 text-[#CC785C]" />
          Pending Approvals
        </h1>
        <p className="text-[#736B66] mt-1">
          คำขอจาก user ใหม่ที่รอ admin อนุมัติหรือปฏิเสธ
        </p>
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      {!adminId && (
        <div className="rounded-md p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          คุณต้อง login ในฐานะ admin ก่อนจึงจะอนุมัติคำขอได้
        </div>
      )}

      <ApprovalQueueClient approvals={approvals} adminId={adminId} />
    </div>
  );
}
