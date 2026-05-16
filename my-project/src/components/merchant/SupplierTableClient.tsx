"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SupplierStatus } from "@prisma/client";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Eye,
  MoreHorizontal,
  Pencil,
  PowerOff,
  Power,
  Truck,
  Search,
} from "lucide-react";
import {
  updateSupplier,
  type SupplierListItem,
} from "@/server/actions/suppliers";
import { EditSupplierDialog } from "@/components/merchant/EditSupplierDialog";

interface SupplierTableClientProps {
  suppliers: SupplierListItem[];
}

function statusVariant(
  status: SupplierStatus
): "success" | "secondary" {
  return status === SupplierStatus.ACTIVE ? "success" : "secondary";
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export function SupplierTableClient(
  props: SupplierTableClientProps
): React.ReactElement {
  const { suppliers } = props;
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<SupplierListItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => {
      return (
        s.name.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        (s.contactPerson ?? "").toLowerCase().includes(q) ||
        (s.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [suppliers, search]);

  async function handleToggleStatus(s: SupplierListItem) {
    setBusyId(s.id);
    const nextStatus =
      s.status === SupplierStatus.ACTIVE
        ? SupplierStatus.INACTIVE
        : SupplierStatus.ACTIVE;
    const res = await updateSupplier(s.id, { status: nextStatus });
    setBusyId(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#736B66]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, contact, phone..."
            className="pl-9 bg-white border-[#E8E0D5]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-[#E8E0D5]">
          <Truck className="mx-auto h-12 w-12 text-[#D4A574] mb-3" />
          <h3 className="text-lg font-medium text-[#2D2825]">
            No suppliers found
          </h3>
          <p className="text-[#736B66] text-sm">
            เพิ่ม supplier แรกของคุณเพื่อเริ่มสร้าง Purchase Order
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F0E8]">
                <TableHead className="text-[#2D2825]">Supplier</TableHead>
                <TableHead className="text-[#2D2825]">Contact</TableHead>
                <TableHead className="text-[#2D2825]">Phone</TableHead>
                <TableHead className="text-center text-[#2D2825]">
                  Status
                </TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  PO Count
                </TableHead>
                <TableHead className="text-[#2D2825]">Last Order</TableHead>
                <TableHead className="text-right text-[#2D2825]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className="hover:bg-[#F5F0E8]/40 transition-colors"
                >
                  <TableCell>
                    <Link
                      href={`/merchant/suppliers/${s.id}`}
                      className="font-medium text-[#CC785C] hover:underline"
                    >
                      {s.name}
                    </Link>
                    <div className="text-xs text-[#736B66]">
                      {s.email ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#2D2825]">
                    {s.contactPerson ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-[#2D2825]">
                    {s.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusVariant(s.status)}>
                      {busyId === s.id ? "Updating..." : s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[#2D2825]">
                    {s.poCount}
                  </TableCell>
                  <TableCell className="text-sm text-[#736B66]">
                    {formatDate(s.lastOrderAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={busyId === s.id}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-white border-[#E8E0D5]"
                      >
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/merchant/suppliers/${s.id}`}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4 text-[#736B66]" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditTarget(s)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4 text-[#CC785C]" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(s)}
                          className="cursor-pointer"
                        >
                          {s.status === SupplierStatus.ACTIVE ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4 text-destructive" />
                              Deactivate
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

      <EditSupplierDialog
        supplier={editTarget}
        open={!!editTarget}
        onOpenChange={(o) => {
          if (!o) setEditTarget(null);
        }}
      />
    </div>
  );
}
