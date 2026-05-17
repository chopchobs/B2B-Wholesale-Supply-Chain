import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Building2, ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listWarehouses } from "@/server/actions/warehouse";
import { WarehouseCard } from "@/components/warehouse/WarehouseCard";
import { CreateWarehouseDialog } from "@/components/warehouse/CreateWarehouseDialog";

export const dynamic = "force-dynamic";

export default async function WarehouseListPage(): Promise<React.ReactElement> {
  const result = await listWarehouses();
  const warehouses = result.data ?? [];
  const loadError = result.error;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      {/* Back */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
            <Building2 className="h-7 w-7 text-[#CC785C]" />
            Warehouses
          </h1>
          <p className="text-[#736B66] mt-1">
            จัดการคลังสินค้า ดูสต็อก และโอนย้ายระหว่างคลัง
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/merchant/warehouse/transfer">
            <Button
              variant="outline"
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
            >
              <ArrowRightLeft className="h-4 w-4 mr-1" />
              Transfer Stock
            </Button>
          </Link>
          <CreateWarehouseDialog />
        </div>
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      {/* Grid or Empty */}
      {warehouses.length === 0 ? (
        <div className="rounded-xl border border-[#E8E0D5] bg-white p-12 text-center">
          <Building2 className="h-12 w-12 text-[#736B66] mx-auto mb-3" />
          <p className="text-[#2D2825] font-semibold text-lg">
            No warehouses yet
          </p>
          <p className="text-sm text-[#736B66] mt-1 mb-4">
            สร้างคลังสินค้าแรกของคุณเพื่อเริ่มจัดการสต็อก
          </p>
          <CreateWarehouseDialog />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((w) => (
            <WarehouseCard key={w.id} warehouse={w} />
          ))}
        </div>
      )}
    </div>
  );
}
