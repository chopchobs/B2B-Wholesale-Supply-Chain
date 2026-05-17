import * as React from "react";
import Link from "next/link";
import { Building2, MapPin, Package, Boxes } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WarehouseListItem } from "@/server/actions/warehouse";

interface WarehouseCardProps {
  warehouse: WarehouseListItem;
}

export function WarehouseCard(props: WarehouseCardProps): React.ReactElement {
  const { warehouse } = props;

  // รวมที่อยู่จาก address + city + country ให้แสดงผลสวย
  const locationParts = [warehouse.address, warehouse.city, warehouse.country].filter(
    (v): v is string => Boolean(v && v.trim().length > 0)
  );
  const locationDisplay = locationParts.length > 0 ? locationParts.join(", ") : "—";

  return (
    <Link
      href={`/merchant/warehouse/${warehouse.id}`}
      className="block focus:outline-none focus:ring-2 focus:ring-[#CC785C] rounded-xl"
    >
      <Card className="bg-white border-[#E8E0D5] hover:border-[#CC785C] transition-colors h-full">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#CC785C]/10">
                <Building2 className="h-5 w-5 text-[#CC785C]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-[#2D2825] truncate">
                  {warehouse.name}
                </h3>
                <p className="text-xs font-mono text-[#736B66] truncate">
                  {warehouse.code}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {warehouse.isDefault && (
                <Badge className="bg-[#D4A574] text-white hover:bg-[#D4A574] border-transparent">
                  Default
                </Badge>
              )}
              <Badge
                className={
                  warehouse.isActive
                    ? "bg-[#CC785C]/10 text-[#CC785C] border-[#CC785C]/30 hover:bg-[#CC785C]/10"
                    : "bg-[#E8E0D5] text-[#736B66] border-[#E8E0D5] hover:bg-[#E8E0D5]"
                }
                variant="outline"
              >
                {warehouse.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-[#736B66] mt-0.5 shrink-0" />
            <p className="text-[#736B66] line-clamp-2">{locationDisplay}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E0D5]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-[#736B66]">
                <Package className="h-3.5 w-3.5" />
                Items
              </div>
              <p className="text-lg font-semibold text-[#2D2825]">
                {warehouse.itemCount.toLocaleString()}
              </p>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-[#736B66]">
                <Boxes className="h-3.5 w-3.5" />
                Total Stock
              </div>
              <p className="text-lg font-semibold text-[#2D2825]">
                {warehouse.totalStock.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
