import React from "react";
import { notFound } from "next/navigation";
import { getShipmentById } from "@/server/actions/shipments";
import { PackingSlipView } from "@/components/merchant/PackingSlipView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PackingSlipPage(
  props: PageProps
): Promise<React.ReactElement> {
  const { id } = await props.params;
  const res = await getShipmentById(id);

  if (!res.data) {
    if (res.error === "Shipment not found.") notFound();
    return (
      <div className="p-8 text-destructive">
        {res.error ?? "Shipment not found."}
      </div>
    );
  }

  return <PackingSlipView shipment={res.data} />;
}
