import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UsersRound,
  Store,
  ShoppingBag,
  AlertTriangle,
  History,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getUsers,
  getUserSummary,
  getAuditLogs,
} from "@/server/actions/users";
import { UserTableClient } from "@/components/merchant/UserTableClient";
import { AuditLogTable } from "@/components/merchant/AuditLogTable";

export const dynamic = "force-dynamic";

export default async function MerchantUsersPage(): Promise<React.ReactElement> {
  const [usersRes, summaryRes, auditRes] = await Promise.all([
    getUsers(),
    getUserSummary(),
    getAuditLogs(),
  ]);

  const users = usersRes.data ?? [];
  const summary =
    summaryRes.data ?? {
      totalUsers: 0,
      admins: 0,
      merchants: 0,
      vipClients: 0,
      buyers: 0,
      pendingApprovals: 0,
      suspendedUsers: 0,
    };
  const auditLogs = auditRes.data ?? [];

  const loadError = usersRes.error ?? summaryRes.error ?? auditRes.error;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      <div className="flex items-center gap-2">
        <Link href="/merchant">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
            <UsersRound className="h-7 w-7 text-[#CC785C]" />
            Users & Roles
          </h1>
          <p className="text-[#736B66] mt-1">
            จัดการ user, role และคำขออนุมัติทั้งหมดในระบบ
          </p>
        </div>
        <Link href="/merchant/users/approvals">
          <Button className="bg-[#CC785C] text-white hover:bg-[#B86548]">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Pending Approvals
            {summary.pendingApprovals > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-white text-[#CC785C] px-2 py-0.5 text-xs font-semibold">
                {summary.pendingApprovals}
              </span>
            )}
          </Button>
        </Link>
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Total Users
            </CardTitle>
            <UsersRound className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {summary.totalUsers}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              จำนวน user ทั้งหมดในระบบ
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Merchants
            </CardTitle>
            <Store className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#CC785C]">
              {summary.merchants}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              ร้านค้า/พาร์ตเนอร์ที่ได้รับอนุมัติ
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Buyers
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {summary.buyers + summary.vipClients}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              {summary.vipClients} VIP / {summary.buyers} ทั่วไป
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Pending Approval
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                summary.pendingApprovals > 0
                  ? "text-[#CC785C]"
                  : "text-[#D4A574]"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.pendingApprovals > 0
                  ? "text-[#CC785C]"
                  : "text-[#2D2825]"
              }`}
            >
              {summary.pendingApprovals}
            </div>
            <p className="text-xs text-[#736B66] mt-1">
              คำขอที่รอ admin อนุมัติ
            </p>
          </CardContent>
        </Card>
      </div>

      <UserTableClient users={users} />

      <div className="space-y-3 pt-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[#CC785C]" />
          <h2 className="text-xl font-bold text-[#2D2825]">Audit Trail</h2>
        </div>
        <p className="text-sm text-[#736B66]">
          ประวัติการกระทำสำคัญในระบบ (200 รายการล่าสุด)
        </p>
        <AuditLogTable logs={auditLogs} />
      </div>
    </div>
  );
}
