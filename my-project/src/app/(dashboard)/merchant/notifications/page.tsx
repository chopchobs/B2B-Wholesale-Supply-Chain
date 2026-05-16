import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  getNotifications,
  checkOverdueInvoices,
} from "@/server/actions/notifications";
import { NotificationListClient } from "@/components/merchant/NotificationListClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Trigger overdue check ทุกครั้งที่เปิดหน้า notifications (lightweight)
  await checkOverdueInvoices();

  const result = await getNotifications(user.id);
  const items = result.data ?? [];

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/merchant"
            className="inline-flex items-center text-xs font-medium text-[#736B66] hover:text-[#CC785C]"
          >
            <ArrowLeft className="mr-1 h-3 w-3" /> Back to Dashboard
          </Link>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-[#2D2825]">
            <Bell className="h-7 w-7 text-[#CC785C]" />
            Notifications
          </h1>
          <p className="text-sm text-[#736B66]">
            Stay on top of inventory alerts, order updates, and overdue invoices.
          </p>
        </div>
        <Link href="/merchant">
          <Button
            variant="outline"
            size="sm"
            className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
          >
            Dashboard
          </Button>
        </Link>
      </div>

      {result.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {result.error}
        </div>
      ) : (
        <NotificationListClient initialItems={items} userId={user.id} />
      )}
    </div>
  );
}
