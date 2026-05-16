"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, CheckCircle2, XCircle, Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  setDefaultWarehouse,
  updateWarehouse,
  type WarehouseItem,
} from "@/server/actions/settings";
import { EditWarehouseDialog } from "./EditWarehouseDialog";

interface WarehouseTableClientProps {
  warehouses: WarehouseItem[];
}

export function WarehouseTableClient({
  warehouses,
}: WarehouseTableClientProps): React.ReactElement {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleSetDefault(id: string): Promise<void> {
    setErrorMsg(null);
    setPendingId(id);
    const res = await setDefaultWarehouse(id);
    setPendingId(null);
    if (res.error) {
      setErrorMsg(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function handleToggleActive(w: WarehouseItem): Promise<void> {
    setErrorMsg(null);
    setPendingId(w.id);
    const res = await updateWarehouse(w.id, { isActive: !w.isActive });
    setPendingId(null);
    if (res.error) {
      setErrorMsg(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="text-sm font-medium text-destructive p-3 bg-destructive/10 rounded-md">
          {errorMsg}
        </div>
      )}

      <div className="bg-white border border-[#E8E0D5] rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-[#E8E0D5]">
              <TableHead className="text-[#736B66]">Code</TableHead>
              <TableHead className="text-[#736B66]">Name</TableHead>
              <TableHead className="text-[#736B66]">Location</TableHead>
              <TableHead className="text-[#736B66]">Status</TableHead>
              <TableHead className="text-right text-[#736B66]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-[#736B66]"
                >
                  ยังไม่มีคลังสินค้า กด &quot;Add Warehouse&quot; เพื่อเริ่มต้น
                </TableCell>
              </TableRow>
            ) : (
              warehouses.map((w) => {
                const isPending = pendingId === w.id;
                const location = [w.city, w.country]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <TableRow
                    key={w.id}
                    className="border-b-[#E8E0D5] hover:bg-[#F5F0E8]/50"
                  >
                    <TableCell className="font-mono text-[#2D2825] font-medium">
                      {w.code}
                    </TableCell>
                    <TableCell className="text-[#2D2825]">
                      <div className="flex items-center gap-2">
                        {w.name}
                        {w.isDefault && (
                          <Badge className="bg-[#D4A574]/20 text-[#2D2825] border border-[#D4A574]/40 hover:bg-[#D4A574]/30">
                            <Star className="h-3 w-3 mr-1 text-[#CC785C]" />
                            Default
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#736B66] text-sm">
                      {location || "—"}
                    </TableCell>
                    <TableCell>
                      {w.isActive ? (
                        <Badge className="bg-[#CC785C]/10 text-[#CC785C] border border-[#CC785C]/30 hover:bg-[#CC785C]/15">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-[#E8E0D5] text-[#736B66]"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!w.isDefault && w.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleSetDefault(w.id)}
                            className="text-[#CC785C] hover:text-[#B86548] hover:bg-[#F5F0E8]"
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Star className="h-4 w-4 mr-1" />
                                Set Default
                              </>
                            )}
                          </Button>
                        )}
                        <EditWarehouseDialog warehouse={w} />
                        {!w.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleToggleActive(w)}
                            className="text-[#736B66] hover:text-[#2D2825] hover:bg-[#F5F0E8]"
                          >
                            {w.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
