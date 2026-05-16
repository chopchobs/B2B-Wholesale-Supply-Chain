"use client";

import React from "react";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ShipmentDetail } from "@/server/actions/shipments";

interface PackingSlipViewProps {
  shipment: ShipmentDetail;
}

export function PackingSlipView({
  shipment,
}: PackingSlipViewProps): React.ReactElement {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] py-8 print:bg-white print:py-0">
      {/* Toolbar — hide on print */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between px-4 print:hidden">
        <Link href={`/merchant/shipping/shipments/${shipment.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Shipment
          </Button>
        </Link>
        <Button
          onClick={handlePrint}
          className="bg-[#CC785C] text-white hover:bg-[#B86548]"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-10 shadow-sm print:shadow-none print:p-6 border border-[#E8E0D5] print:border-0">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E8E0D5] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2D2825]">
              PACKING SLIP
            </h1>
            <div className="mt-2 text-sm text-[#736B66]">
              Shipment #{" "}
              <span className="font-mono text-[#2D2825]">
                {shipment.shipmentNumber}
              </span>
            </div>
            <div className="text-sm text-[#736B66]">
              Date: {new Date(shipment.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="text-right text-sm text-[#736B66]">
            <div className="text-base font-semibold text-[#2D2825]">
              B2B Wholesale
            </div>
            <div>Supply Chain Management</div>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 mt-6">
          <div>
            <div className="text-xs font-semibold uppercase text-[#736B66] mb-2">
              Ship To
            </div>
            <div className="text-[#2D2825] font-semibold">
              {shipment.shipToName}
            </div>
            {shipment.shipToPhone && (
              <div className="text-sm text-[#2D2825]">
                {shipment.shipToPhone}
              </div>
            )}
            <div className="text-sm text-[#2D2825] whitespace-pre-line mt-1">
              {shipment.shipToAddress}
            </div>
            <div className="text-sm text-[#736B66]">
              {[shipment.shipToCity, shipment.shipToPostal, shipment.shipToCountry]
                .filter(Boolean)
                .join(", ")}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase text-[#736B66] mb-2">
              Shipment Info
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-[#736B66]">Order:</span>{" "}
                <span className="font-mono text-[#2D2825]">
                  #{shipment.orderId.substring(0, 12)}
                </span>
              </div>
              <div>
                <span className="text-[#736B66]">Carrier:</span>{" "}
                <span className="text-[#2D2825]">
                  {shipment.carrierName ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-[#736B66]">Tracking:</span>{" "}
                <span className="font-mono text-[#2D2825]">
                  {shipment.trackingNumber ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-[#736B66]">Weight:</span>{" "}
                <span className="text-[#2D2825]">{shipment.weightKg} kg</span>
              </div>
              {shipment.estimatedDelivery && (
                <div>
                  <span className="text-[#736B66]">Est. Delivery:</span>{" "}
                  <span className="text-[#2D2825]">
                    {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="mt-8">
          <div className="text-xs font-semibold uppercase text-[#736B66] mb-2">
            Items
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#E8E0D5] text-left">
                <th className="py-2 text-[#736B66] font-medium">SKU</th>
                <th className="py-2 text-[#736B66] font-medium">Product</th>
                <th className="py-2 text-right text-[#736B66] font-medium">
                  Qty
                </th>
                <th className="py-2 text-right text-[#736B66] font-medium">
                  Ordered
                </th>
              </tr>
            </thead>
            <tbody>
              {shipment.items.map((it) => (
                <tr key={it.id} className="border-b border-[#E8E0D5]">
                  <td className="py-2 font-mono text-xs text-[#2D2825]">
                    {it.productSku}
                  </td>
                  <td className="py-2 text-[#2D2825]">{it.productName}</td>
                  <td className="py-2 text-right text-[#2D2825] font-semibold">
                    {it.quantity}
                  </td>
                  <td className="py-2 text-right text-[#736B66]">
                    {it.orderedQuantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#E8E0D5] text-xs text-[#736B66]">
          {shipment.notes && (
            <div className="mb-4">
              <span className="font-semibold text-[#2D2825]">Notes: </span>
              {shipment.notes}
            </div>
          )}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="border-t border-[#736B66] pt-2 text-center">
              Packed by
            </div>
            <div className="border-t border-[#736B66] pt-2 text-center">
              Checked by
            </div>
            <div className="border-t border-[#736B66] pt-2 text-center">
              Received by
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
