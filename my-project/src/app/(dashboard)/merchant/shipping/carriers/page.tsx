import React from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCarriers } from "@/server/actions/carriers";
import { CarrierTableClient } from "@/components/merchant/CarrierTableClient";
import { AddCarrierDialog } from "@/components/merchant/AddCarrierDialog";

export const dynamic = "force-dynamic";

export default async function CarriersPage(): Promise<React.ReactElement> {
  const res = await getCarriers();
  const carriers = res.data ?? [];

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
            <Building2 className="h-7 w-7 text-[#CC785C]" />
            Carriers
          </h1>
          <p className="text-[#736B66] mt-1">
            จัดการผู้ให้บริการขนส่งและข้อมูลติดต่อ
          </p>
        </div>
        <AddCarrierDialog />
      </div>

      {res.error && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {res.error}
        </div>
      )}

      <CarrierTableClient carriers={carriers} />
    </div>
  );
}
