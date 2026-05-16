import React from "react";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getShippingRates,
  getShippingZones,
} from "@/server/actions/shippingRates";
import { getActiveCarriers } from "@/server/actions/carriers";
import { RatesZonesClient } from "@/components/merchant/RatesZonesClient";

export const dynamic = "force-dynamic";

export default async function RatesZonesPage(): Promise<React.ReactElement> {
  const [ratesRes, zonesRes, carriersRes] = await Promise.all([
    getShippingRates(),
    getShippingZones(),
    getActiveCarriers(),
  ]);

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

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
          <Layers className="h-7 w-7 text-[#D4A574]" />
          Rates & Zones
        </h1>
        <p className="text-[#736B66] mt-1">
          ตั้งค่าโซนการจัดส่งและเรทค่าบริการแยกตาม carrier
        </p>
      </div>

      <RatesZonesClient
        rates={ratesRes.data ?? []}
        zones={zonesRes.data ?? []}
        carriers={carriersRes.data ?? []}
      />
    </div>
  );
}
