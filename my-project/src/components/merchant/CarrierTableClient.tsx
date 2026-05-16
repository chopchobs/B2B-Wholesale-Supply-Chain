"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, MoreHorizontal, Power, Trash2 } from "lucide-react";
import type { CarrierStatus } from "@prisma/client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  updateCarrier,
  deleteCarrier,
  type CarrierListItem,
} from "@/server/actions/carriers";

interface CarrierTableClientProps {
  carriers: CarrierListItem[];
}

export function CarrierTableClient({
  carriers,
}: CarrierTableClientProps): React.ReactElement {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleStatus(id: string, current: CarrierStatus) {
    setBusyId(id);
    setError(null);
    const next: CarrierStatus = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await updateCarrier(id, { status: next });
    setBusyId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    const res = await deleteCarrier(id);
    setBusyId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <Card className="bg-white border-[#E8E0D5]">
      <CardContent className="p-4 space-y-3">
        {error && (
          <div className="rounded-md p-3 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="rounded-md border border-[#E8E0D5] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F0E8] hover:bg-[#F5F0E8]">
                <TableHead className="text-[#736B66]">Carrier</TableHead>
                <TableHead className="text-[#736B66]">Code</TableHead>
                <TableHead className="text-[#736B66]">Contact</TableHead>
                <TableHead className="text-[#736B66]">Shipments</TableHead>
                <TableHead className="text-[#736B66]">Rates</TableHead>
                <TableHead className="text-[#736B66]">Status</TableHead>
                <TableHead className="text-right text-[#736B66]">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carriers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-[#736B66] text-sm"
                  >
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-[#D4A574]" />
                    ยังไม่มี carrier — เริ่มต้นโดยเพิ่ม carrier แรกของคุณ
                  </TableCell>
                </TableRow>
              ) : (
                carriers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-[#F5F0E8]/40">
                    <TableCell className="text-[#2D2825] font-medium">
                      {c.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#736B66]">
                      {c.code}
                    </TableCell>
                    <TableCell className="text-sm text-[#736B66]">
                      {c.contactName ?? "—"}
                      {c.contactPhone && (
                        <div className="text-xs">{c.contactPhone}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-[#2D2825]">
                      {c.shipmentCount}
                    </TableCell>
                    <TableCell className="text-[#2D2825]">
                      {c.rateCount}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={c.status === "ACTIVE" ? "success" : "default"}
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busyId === c.id}
                            className="h-7 w-7 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem
                            onClick={() => toggleStatus(c.id, c.status)}
                          >
                            <Power className="mr-2 h-3.5 w-3.5" />
                            {c.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(c.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
