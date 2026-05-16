import React from "react";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getShipments,
  getShippableOrders,
} from "@/server/actions/shipments";
import { getActiveCarriers } from "@/server/actions/carriers";
import { ShipmentTableClient } from "@/components/merchant/ShipmentTableClient";
import { CreateShipmentDialog } from "@/components/merchant/CreateShipmentDialog";

export const dynamic = "force-dynamic";

export default async function ShipmentsListPage(): Promise<React.ReactElement> {
  const [shipmentsRes, ordersRes, carriersRes] = await Promise.all([
    getShipments(),
    getShippableOrders(),
    getActiveCarriers(),
  ]);

  const shipments = shipmentsRes.data ?? [];
  const shippableOrders = ordersRes.data ?? [];
  const carriers = carriersRes.data ?? [];
  const loadError = shipmentsRes.error;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      <div className="flex items-center gap-2">
        <Link href="/merchant/shipping">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Shipping
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
            <Package className="h-7 w-7 text-[#CC785C]" />
            All Shipments
          </h1>
          <p className="text-[#736B66] mt-1">
            จัดการและติดตาม shipment ขาออกทั้งหมด
          </p>
        </div>
        <CreateShipmentDialog
          shippableOrders={shippableOrders}
          carriers={carriers}
        />
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      <ShipmentTableClient shipments={shipments} />
    </div>
  );
}
