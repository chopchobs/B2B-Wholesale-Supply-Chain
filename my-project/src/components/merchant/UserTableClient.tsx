"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Role, ApprovalStatus } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Eye,
  MoreHorizontal,
  ShieldCheck,
  PowerOff,
  Power,
  UsersRound,
  Search,
} from "lucide-react";
import {
  suspendUser,
  activateUser,
  type UserListItem,
} from "@/server/actions/users";
import { ChangeRoleDialog } from "@/components/merchant/ChangeRoleDialog";

interface UserTableClientProps {
  users: UserListItem[];
}

type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED" | "PENDING";

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

function approvalBadge(
  status: ApprovalStatus | null
): "success" | "destructive" | "warning" | "secondary" {
  if (status === ApprovalStatus.APPROVED) return "success";
  if (status === ApprovalStatus.REJECTED) return "destructive";
  if (status === ApprovalStatus.PENDING) return "warning";
  return "secondary";
}

export function UserTableClient(
  props: UserTableClientProps
): React.ReactElement {
  const { users } = props;
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [roleTarget, setRoleTarget] = useState<UserListItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && !u.isActive) return false;
        if (statusFilter === "SUSPENDED" && u.isActive) return false;
        if (
          statusFilter === "PENDING" &&
          u.latestApprovalStatus !== ApprovalStatus.PENDING
        ) {
          return false;
        }
      }
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.customerCompany ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  async function handleToggleStatus(u: UserListItem) {
    setBusyId(u.id);
    const res = u.isActive ? await suspendUser(u.id) : await activateUser(u.id);
    setBusyId(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#736B66]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company..."
            className="pl-9 bg-white border-[#E8E0D5]"
          />
        </div>

        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as Role | "ALL")}
        >
          <SelectTrigger className="w-[160px] bg-white border-[#E8E0D5]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            <SelectItem value={Role.ADMIN}>Admin</SelectItem>
            <SelectItem value={Role.MERCHANT}>Merchant</SelectItem>
            <SelectItem value={Role.VIP_CLIENT}>VIP Client</SelectItem>
            <SelectItem value={Role.USER}>Buyer</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-[160px] bg-white border-[#E8E0D5]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="PENDING">Pending Approval</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-[#E8E0D5]">
          <UsersRound className="mx-auto h-12 w-12 text-[#D4A574] mb-3" />
          <h3 className="text-lg font-medium text-[#2D2825]">
            No users found
          </h3>
          <p className="text-[#736B66] text-sm">
            ลองปรับ filter หรือลองค้นหาด้วยคีย์เวิร์ดอื่น
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F0E8]">
                <TableHead className="text-[#2D2825]">User</TableHead>
                <TableHead className="text-[#2D2825]">Company</TableHead>
                <TableHead className="text-center text-[#2D2825]">
                  Role
                </TableHead>
                <TableHead className="text-center text-[#2D2825]">
                  Status
                </TableHead>
                <TableHead className="text-center text-[#2D2825]">
                  Approval
                </TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  Orders
                </TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow
                  key={u.id}
                  className="hover:bg-[#F5F0E8]/40 transition-colors"
                >
                  <TableCell>
                    <Link
                      href={`/merchant/users/${u.id}`}
                      className="font-medium text-[#CC785C] hover:underline"
                    >
                      {u.name ?? "—"}
                    </Link>
                    <div className="text-xs text-[#736B66]">{u.email}</div>
                  </TableCell>
                  <TableCell className="text-sm text-[#2D2825]">
                    {u.customerCompany ?? (
                      <span className="text-[#736B66]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={roleBadge(u.role)}>{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={u.isActive ? "success" : "destructive"}>
                      {busyId === u.id
                        ? "Updating..."
                        : u.isActive
                        ? "ACTIVE"
                        : "SUSPENDED"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={approvalBadge(u.latestApprovalStatus)}>
                      {u.latestApprovalStatus ?? "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[#2D2825]">
                    {u.orderCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={busyId === u.id}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-52 bg-white border-[#E8E0D5]"
                      >
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/merchant/users/${u.id}`}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4 text-[#736B66]" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setRoleTarget(u)}
                          className="cursor-pointer"
                        >
                          <ShieldCheck className="mr-2 h-4 w-4 text-[#CC785C]" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(u)}
                          className="cursor-pointer"
                        >
                          {u.isActive ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4 text-destructive" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4 text-[#D4A574]" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ChangeRoleDialog
        user={roleTarget}
        open={!!roleTarget}
        onOpenChange={(o) => {
          if (!o) setRoleTarget(null);
        }}
      />
    </div>
  );
}
