"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerStatus, CustomerTier } from "@prisma/client";
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
  Pencil,
  PowerOff,
  Power,
  Users,
  Search,
  Crown,
  CreditCard,
} from "lucide-react";
import {
  suspendCustomer,
  activateCustomer,
  type CustomerListItem,
} from "@/server/actions/customers";
import { EditCustomerProfileDialog } from "@/components/merchant/EditCustomerProfileDialog";
import { UpdateTierDialog } from "@/components/merchant/UpdateTierDialog";
import { AdjustCreditDialog } from "@/components/merchant/AdjustCreditDialog";

interface CustomerTableClientProps {
  customers: CustomerListItem[];
}

function tierVariant(
  tier: CustomerTier
): "secondary" | "info" | "warning" | "vip" {
  switch (tier) {
    case CustomerTier.PLATINUM:
      return "vip";
    case CustomerTier.GOLD:
      return "warning";
    case CustomerTier.SILVER:
      return "info";
    default:
      return "secondary";
  }
}

function statusVariant(
  status: CustomerStatus
): "success" | "destructive" | "warning" {
  switch (status) {
    case CustomerStatus.ACTIVE:
      return "success";
    case CustomerStatus.SUSPENDED:
      return "destructive";
    default:
      return "warning";
  }
}

function formatTHB(n: number): string {
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function CustomerTableClient(
  props: CustomerTableClientProps
): React.ReactElement {
  const { customers } = props;
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<CustomerTier | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "ALL">(
    "ALL"
  );
  const [editTarget, setEditTarget] = useState<CustomerListItem | null>(null);
  const [tierTarget, setTierTarget] = useState<CustomerListItem | null>(null);
  const [creditTarget, setCreditTarget] = useState<CustomerListItem | null>(
    null
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (tierFilter !== "ALL" && c.accountTier !== tierFilter) return false;
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.companyName.toLowerCase().includes(q) ||
        c.userEmail.toLowerCase().includes(q) ||
        (c.userName ?? "").toLowerCase().includes(q) ||
        (c.taxId ?? "").toLowerCase().includes(q)
      );
    });
  }, [customers, search, tierFilter, statusFilter]);

  async function handleToggleStatus(c: CustomerListItem) {
    setBusyId(c.id);
    const res =
      c.status === CustomerStatus.ACTIVE
        ? await suspendCustomer(c.id)
        : await activateCustomer(c.id);
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
            placeholder="Search company, email, tax ID..."
            className="pl-9 bg-white border-[#E8E0D5]"
          />
        </div>

        <Select
          value={tierFilter}
          onValueChange={(v) => setTierFilter(v as CustomerTier | "ALL")}
        >
          <SelectTrigger className="w-[160px] bg-white border-[#E8E0D5]">
            <SelectValue placeholder="All tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All tiers</SelectItem>
            <SelectItem value={CustomerTier.BRONZE}>Bronze</SelectItem>
            <SelectItem value={CustomerTier.SILVER}>Silver</SelectItem>
            <SelectItem value={CustomerTier.GOLD}>Gold</SelectItem>
            <SelectItem value={CustomerTier.PLATINUM}>Platinum</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as CustomerStatus | "ALL")}
        >
          <SelectTrigger className="w-[160px] bg-white border-[#E8E0D5]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value={CustomerStatus.ACTIVE}>Active</SelectItem>
            <SelectItem value={CustomerStatus.PENDING}>Pending</SelectItem>
            <SelectItem value={CustomerStatus.SUSPENDED}>Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-[#E8E0D5]">
          <Users className="mx-auto h-12 w-12 text-[#D4A574] mb-3" />
          <h3 className="text-lg font-medium text-[#2D2825]">
            No customers found
          </h3>
          <p className="text-[#736B66] text-sm">
            ลองปรับ filter หรือสร้าง customer profile ใหม่
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F0E8]">
                <TableHead className="text-[#2D2825]">Company</TableHead>
                <TableHead className="text-[#2D2825]">Contact</TableHead>
                <TableHead className="text-center text-[#2D2825]">
                  Tier
                </TableHead>
                <TableHead className="text-center text-[#2D2825]">
                  Status
                </TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  Orders
                </TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  Total Spend
                </TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  Credit (Used / Limit)
                </TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow
                  key={c.id}
                  className="hover:bg-[#F5F0E8]/40 transition-colors"
                >
                  <TableCell>
                    <Link
                      href={`/merchant/customers/${c.id}`}
                      className="font-medium text-[#CC785C] hover:underline"
                    >
                      {c.companyName}
                    </Link>
                    <div className="text-xs text-[#736B66]">
                      {c.taxId ? `Tax ID: ${c.taxId}` : "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#2D2825]">
                    {c.userName ?? "—"}
                    <div className="text-xs text-[#736B66]">{c.userEmail}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={tierVariant(c.accountTier)}>
                      {c.accountTier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusVariant(c.status)}>
                      {busyId === c.id ? "Updating..." : c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[#2D2825]">
                    {c.orderCount}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[#CC785C]">
                    {formatTHB(c.totalSpend)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-[#2D2825]">
                    <span className="text-[#CC785C] font-semibold">
                      {formatTHB(c.creditUsed)}
                    </span>
                    <span className="text-[#736B66]">
                      {" "}
                      / {formatTHB(c.creditLimit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={busyId === c.id}
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
                            href={`/merchant/customers/${c.id}`}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4 text-[#736B66]" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditTarget(c)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4 text-[#CC785C]" />
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTierTarget(c)}
                          className="cursor-pointer"
                        >
                          <Crown className="mr-2 h-4 w-4 text-[#D4A574]" />
                          Edit Tier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setCreditTarget(c)}
                          className="cursor-pointer"
                        >
                          <CreditCard className="mr-2 h-4 w-4 text-[#CC785C]" />
                          Adjust Credit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(c)}
                          className="cursor-pointer"
                        >
                          {c.status === CustomerStatus.ACTIVE ? (
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

      <EditCustomerProfileDialog
        customer={editTarget}
        open={!!editTarget}
        onOpenChange={(o) => {
          if (!o) setEditTarget(null);
        }}
      />

      <UpdateTierDialog
        customer={tierTarget}
        open={!!tierTarget}
        onOpenChange={(o) => {
          if (!o) setTierTarget(null);
        }}
      />

      <AdjustCreditDialog
        customer={creditTarget}
        open={!!creditTarget}
        onOpenChange={(o) => {
          if (!o) setCreditTarget(null);
        }}
      />
    </div>
  );
}
