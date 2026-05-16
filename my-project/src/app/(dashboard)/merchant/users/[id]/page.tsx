import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  CalendarDays,
  ShieldCheck,
  History,
  ShoppingCart,
  Building2,
} from "lucide-react";
import { ApprovalStatus, OrderStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUserById, type AuditLogListItem } from "@/server/actions/users";
import { UserDetailClient } from "@/components/merchant/UserDetailClient";
import { AuditLogTable } from "@/components/merchant/AuditLogTable";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
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

function formatTHB(n: number): string {
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function approvalVariant(
  status: ApprovalStatus
): "success" | "destructive" | "warning" {
  if (status === ApprovalStatus.APPROVED) return "success";
  if (status === ApprovalStatus.REJECTED) return "destructive";
  return "warning";
}

function orderVariant(
  status: OrderStatus
): "success" | "destructive" | "warning" | "info" {
  switch (status) {
    case OrderStatus.DELIVERED:
      return "success";
    case OrderStatus.CANCELLED:
      return "destructive";
    case OrderStatus.PENDING:
      return "warning";
    default:
      return "info";
  }
}

export default async function UserDetailPage(
  props: PageProps
): Promise<React.ReactElement> {
  const { id } = await props.params;
  const res = await getUserById(id);

  if (res.error === "User not found." || !res.data) {
    notFound();
  }

  const user = res.data;

  // map audit logs ของ user คนนี้ให้เป็น AuditLogListItem (เติม userName/Email)
  const auditLogs: AuditLogListItem[] = user.auditLogs.map((l) => ({
    ...l,
    userName: user.name,
    userEmail: user.email,
  }));

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

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
            <UserIcon className="h-7 w-7 text-[#CC785C]" />
            {user.name ?? user.email}
          </h1>
          <p className="text-[#736B66] mt-1 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {user.email}
          </p>
        </div>

        <UserDetailClient user={user} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Role
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[#2D2825]">{user.role}</div>
            <p className="text-xs text-[#736B66] mt-1">
              สิทธิ์การใช้งานในระบบ
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={user.isActive ? "success" : "destructive"}>
              {user.isActive ? "ACTIVE" : "SUSPENDED"}
            </Badge>
            <p className="text-xs text-[#736B66] mt-2">
              {user.latestApprovalStatus
                ? `Approval: ${user.latestApprovalStatus}`
                : "ยังไม่มี approval record"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {user.orderCount}
            </div>
            <p className="text-xs text-[#736B66] mt-1">คำสั่งซื้อทั้งหมด</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Member Since
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-[#2D2825]">
              {formatDate(user.createdAt)}
            </div>
          </CardContent>
        </Card>
      </div>

      {user.customerCompany && (
        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2D2825]">
              <Building2 className="h-5 w-5 text-[#CC785C]" />
              Customer Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
            <div>
              <p className="text-xs text-[#736B66]">Company</p>
              <p className="font-semibold text-[#2D2825]">
                {user.customerCompany}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#736B66]">Tier</p>
              <p className="font-semibold text-[#2D2825]">
                {user.customerTier ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#736B66]">Customer Status</p>
              <p className="font-semibold text-[#2D2825]">
                {user.customerStatus ?? "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2D2825]">
            <History className="h-5 w-5 text-[#CC785C]" />
            Approval History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.approvals.length === 0 ? (
            <p className="text-sm text-[#736B66]">
              ยังไม่มีประวัติการอนุมัติ
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F0E8]">
                  <TableHead className="text-[#2D2825]">Requested</TableHead>
                  <TableHead className="text-[#2D2825]">Status</TableHead>
                  <TableHead className="text-[#2D2825]">Reviewer</TableHead>
                  <TableHead className="text-[#2D2825]">Reviewed</TableHead>
                  <TableHead className="text-[#2D2825]">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.approvals.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs text-[#736B66]">
                      {formatDate(a.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={approvalVariant(a.status)}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825]">
                      {a.reviewerName ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-[#736B66]">
                      {a.reviewedAt ? formatDate(a.reviewedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825] max-w-xs truncate">
                      {a.note ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2D2825]">
            <ShoppingCart className="h-5 w-5 text-[#CC785C]" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.recentOrders.length === 0 ? (
            <p className="text-sm text-[#736B66]">
              ยังไม่มีคำสั่งซื้อ
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F0E8]">
                  <TableHead className="text-[#2D2825]">Order ID</TableHead>
                  <TableHead className="text-[#2D2825]">Date</TableHead>
                  <TableHead className="text-[#2D2825]">Status</TableHead>
                  <TableHead className="text-right text-[#2D2825]">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs text-[#736B66]">
                      #{o.id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs text-[#736B66]">
                      {formatDate(o.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={orderVariant(o.status)}>{o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#CC785C]">
                      {formatTHB(o.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[#CC785C]" />
          <h2 className="text-xl font-bold text-[#2D2825]">Audit Trail</h2>
        </div>
        <AuditLogTable logs={auditLogs} />
      </div>
    </div>
  );
}
