import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  MapPin,
  Package,
  Boxes,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getWarehouseById,
  getWarehouseInventory,
} from "@/server/actions/warehouse";
import { WarehouseInventoryTable } from "@/components/warehouse/WarehouseInventoryTable";
import { CapacityBar } from "@/components/warehouse/CapacityBar";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WarehouseDetailPage(
  props: PageProps
): Promise<React.ReactElement> {
  const { id } = await props.params;

  const [warehouseResult, inventoryResult] = await Promise.all([
    getWarehouseById(id),
    getWarehouseInventory(id),
  ]);

  if (warehouseResult.error === "Warehouse not found." || !warehouseResult.data) {
    notFound();
  }

  const warehouse = warehouseResult.data;
  const inventory = inventoryResult.data ?? [];
  const loadError = inventoryResult.error;
  // capacity เป็น field ตรงๆ ใน schema แล้ว (Phase 24)
  const capacity = warehouse.capacity;

  const locationParts = [warehouse.address, warehouse.city, warehouse.country].filter(
    (v): v is string => Boolean(v && v.trim().length > 0)
  );
  const locationDisplay =
    locationParts.length > 0 ? locationParts.join(", ") : "No address provided";

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#736B66]">
        <Link
          href="/merchant/warehouse"
          className="flex items-center gap-1 hover:text-[#2D2825]"
        >
          <ArrowLeft className="h-4 w-4" />
          Warehouses
        </Link>
        <span>/</span>
        <span className="text-[#2D2825] font-medium">{warehouse.name}</span>
      </div>

      {/* Header Card */}
      <Card className="bg-white border-[#E8E0D5]">
        <CardContent className="p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#CC785C]/10">
                <Building2 className="h-6 w-6 text-[#CC785C]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-[#2D2825]">
                    {warehouse.name}
                  </h1>
                  {warehouse.isDefault && (
                    <Badge className="bg-[#D4A574] text-white hover:bg-[#D4A574] border-transparent">
                      Default
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      warehouse.isActive
                        ? "bg-[#CC785C]/10 text-[#CC785C] border-[#CC785C]/30"
                        : "bg-[#E8E0D5] text-[#736B66] border-[#E8E0D5]"
                    }
                  >
                    {warehouse.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm font-mono text-[#736B66]">
                  {warehouse.code}
                </p>
                <div className="flex items-start gap-2 mt-2 text-sm text-[#736B66]">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{locationDisplay}</span>
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <Link href={`/merchant/warehouse/transfer?from=${warehouse.id}`}>
                <Button className="bg-[#CC785C] text-white hover:bg-[#B86548]">
                  <ArrowRightLeft className="h-4 w-4 mr-1" />
                  Transfer Stock
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E8E0D5]">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#736B66] mb-1">
                <Package className="h-3.5 w-3.5" />
                Items / SKUs
              </div>
              <p className="text-2xl font-bold text-[#2D2825]">
                {warehouse.itemCount.toLocaleString()}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#736B66] mb-1">
                <Boxes className="h-3.5 w-3.5" />
                Total Stock Units
              </div>
              <p className="text-2xl font-bold text-[#2D2825]">
                {warehouse.totalStock.toLocaleString()}
              </p>
            </div>
            {capacity !== null && (
              <div className="col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-xs text-[#736B66] mb-1">
                  Capacity
                </div>
                <p className="text-2xl font-bold text-[#2D2825]">
                  {capacity.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {capacity !== null && (
            <CapacityBar used={warehouse.totalStock} capacity={capacity} />
          )}
        </CardContent>
      </Card>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      {/* Inventory */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-[#2D2825]">
          Inventory in this Warehouse
        </h2>
        <WarehouseInventoryTable items={inventory} />
      </div>
    </div>
  );
}
