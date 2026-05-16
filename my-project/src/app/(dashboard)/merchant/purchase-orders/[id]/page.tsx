import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPurchaseOrderById } from "@/server/actions/purchaseOrders";
import { PurchaseOrderDetailClient } from "@/components/merchant/PurchaseOrderDetailClient";

export const dynamic = "force-dynamic";

interface PurchaseOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderDetailPage(
  props: PurchaseOrderDetailPageProps
): Promise<React.ReactElement> {
  const { id } = await props.params;
  const res = await getPurchaseOrderById(id);

  if (res.error === "Purchase order not found.") {
    notFound();
  }

  if (!res.data) {
    return (
      <div className="flex-1 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {res.error ?? "Purchase order could not be loaded."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      <div className="flex items-center gap-2">
        <Link href="/merchant/purchase-orders">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Purchase Orders
          </Button>
        </Link>
      </div>

      <PurchaseOrderDetailClient purchaseOrder={res.data} />
    </div>
  );
}
