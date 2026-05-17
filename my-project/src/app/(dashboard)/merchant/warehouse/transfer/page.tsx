import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listWarehouseOptions } from "@/server/actions/warehouse";
import { StockTransferForm } from "@/components/warehouse/StockTransferForm";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function StockTransferPage(
  props: PageProps
): Promise<React.ReactElement> {
  const { from } = await props.searchParams;
  const result = await listWarehouseOptions();
  const warehouses = result.data ?? [];
  const loadError = result.error;

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
        <span className="text-[#2D2825] font-medium">Stock Transfer</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
          <ArrowRightLeft className="h-7 w-7 text-[#CC785C]" />
          Stock Transfer
        </h1>
        <p className="text-[#736B66] mt-1">
          ย้ายสินค้าระหว่างคลังโดยใช้ขั้นตอน 4 step
        </p>
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      {warehouses.length < 2 ? (
        <div className="rounded-xl border border-[#E8E0D5] bg-white p-10 text-center">
          <p className="text-[#2D2825] font-semibold">
            Need at least 2 active warehouses
          </p>
          <p className="text-sm text-[#736B66] mt-1 mb-4">
            ต้องมีคลังสินค้าที่ active อย่างน้อย 2 แห่งจึงจะโอนได้
          </p>
          <Link href="/merchant/warehouse">
            <Button
              variant="outline"
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
            >
              Manage Warehouses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="max-w-2xl">
          <StockTransferForm
            warehouses={warehouses}
            initialFromId={from}
          />
        </div>
      )}
    </div>
  );
}
