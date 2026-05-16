import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Package,
  ExternalLink,
  MapPin,
  User as UserIcon,
  Phone,
  FileText,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getShipmentById } from "@/server/actions/shipments";
import { getActiveCarriers } from "@/server/actions/carriers";
import { ShipmentStatusUpdater } from "@/components/merchant/ShipmentStatusUpdater";
import { ShipmentEventForm } from "@/components/merchant/ShipmentEventForm";
import { ShipmentDocumentsManager } from "@/components/merchant/ShipmentDocumentsManager";
import { ShipmentTimeline } from "@/components/merchant/ShipmentTimeline";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getStatusVariant(
  status: string
): "success" | "destructive" | "warning" | "info" | "default" {
  switch (status) {
    case "DELIVERED":
      return "success";
    case "CANCELLED":
    case "FAILED":
    case "RETURNED":
      return "destructive";
    case "PENDING":
    case "READY_TO_SHIP":
      return "warning";
    case "IN_TRANSIT":
    case "OUT_FOR_DELIVERY":
      return "info";
    default:
      return "default";
  }
}

export default async function ShipmentDetailPage(
  props: PageProps
): Promise<React.ReactElement> {
  const { id } = await props.params;
  const [shipmentRes, carriersRes] = await Promise.all([
    getShipmentById(id),
    getActiveCarriers(),
  ]);

  if (!shipmentRes.data) {
    if (shipmentRes.error === "Shipment not found.") notFound();
  }

  const shipment = shipmentRes.data;
  const carriers = carriersRes.data ?? [];

  if (!shipment) {
    return (
      <div className="p-8">
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {shipmentRes.error ?? "Shipment not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/merchant/shipping/shipments">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              All Shipments
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/merchant/shipping/shipments/${shipment.id}/packing-slip`}>
            <Button
              variant="outline"
              size="sm"
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
            >
              <FileText className="mr-2 h-4 w-4 text-[#CC785C]" />
              Packing Slip
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
            <Package className="h-7 w-7 text-[#CC785C]" />
            {shipment.shipmentNumber}
          </h1>
          <p className="text-[#736B66] mt-1 text-sm">
            Order #{shipment.orderId.substring(0, 8)} ·{" "}
            {shipment.customerName ?? shipment.customerEmail}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={getStatusVariant(shipment.status)} className="text-sm">
            {shipment.status.replace(/_/g, " ")}
          </Badge>
          <ShipmentStatusUpdater
            shipmentId={shipment.id}
            currentStatus={shipment.status}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: ship-to + items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-[#E8E0D5]">
            <CardHeader>
              <CardTitle className="text-[#2D2825] flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-[#CC785C]" />
                Ship To
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[#2D2825] font-medium">
                <UserIcon className="h-4 w-4 text-[#736B66]" />
                {shipment.shipToName}
              </div>
              {shipment.shipToPhone && (
                <div className="flex items-center gap-2 text-[#736B66]">
                  <Phone className="h-4 w-4" />
                  {shipment.shipToPhone}
                </div>
              )}
              <div className="text-[#2D2825] whitespace-pre-line">
                {shipment.shipToAddress}
              </div>
              <div className="text-[#736B66] text-xs">
                {[shipment.shipToCity, shipment.shipToPostal, shipment.shipToCountry]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#E8E0D5]">
            <CardHeader>
              <CardTitle className="text-[#2D2825] text-base">
                Items ({shipment.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-[#E8E0D5] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F5F0E8] hover:bg-[#F5F0E8]">
                      <TableHead className="text-[#736B66]">Product</TableHead>
                      <TableHead className="text-[#736B66]">SKU</TableHead>
                      <TableHead className="text-right text-[#736B66]">
                        Qty
                      </TableHead>
                      <TableHead className="text-right text-[#736B66]">
                        Unit Price
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipment.items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="text-[#2D2825]">
                          {it.productName}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-[#736B66]">
                          {it.productSku}
                        </TableCell>
                        <TableCell className="text-right text-[#2D2825]">
                          {it.quantity}{" "}
                          <span className="text-xs text-[#736B66]">
                            / {it.orderedQuantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-[#2D2825]">
                          ฿
                          {it.unitPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#E8E0D5]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#2D2825] text-base">
                Tracking Timeline
              </CardTitle>
              <ShipmentEventForm shipmentId={shipment.id} />
            </CardHeader>
            <CardContent>
              <ShipmentTimeline events={shipment.events} />
            </CardContent>
          </Card>
        </div>

        {/* Right: carrier + cost + docs */}
        <div className="space-y-6">
          <Card className="bg-white border-[#E8E0D5]">
            <CardHeader>
              <CardTitle className="text-[#2D2825] flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-[#CC785C]" />
                Carrier & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-[#736B66]">Carrier</div>
                <div className="text-[#2D2825] font-medium">
                  {shipment.carrierName ?? "ยังไม่ได้กำหนด"}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#736B66]">Tracking Number</div>
                <div className="text-[#2D2825] font-mono">
                  {shipment.trackingNumber ?? "—"}
                </div>
              </div>
              {shipment.trackingUrl && (
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#CC785C] hover:underline"
                >
                  Track on carrier site
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <div className="border-t border-[#E8E0D5] pt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-[#736B66]">Shipping Cost</div>
                  <div className="text-[#2D2825] font-bold">
                    ฿
                    {shipment.shippingCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#736B66]">Weight</div>
                  <div className="text-[#2D2825] font-bold">
                    {shipment.weightKg} kg
                  </div>
                </div>
              </div>
              {shipment.estimatedDelivery && (
                <div>
                  <div className="text-xs text-[#736B66]">Estimated Delivery</div>
                  <div className="text-[#2D2825]">
                    {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                  </div>
                </div>
              )}
              {shipment.shippedAt && (
                <div>
                  <div className="text-xs text-[#736B66]">Shipped At</div>
                  <div className="text-[#2D2825]">
                    {new Date(shipment.shippedAt).toLocaleString()}
                  </div>
                </div>
              )}
              {shipment.deliveredAt && (
                <div>
                  <div className="text-xs text-[#736B66]">Delivered At</div>
                  <div className="text-[#2D2825]">
                    {new Date(shipment.deliveredAt).toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {shipment.notes && (
            <Card className="bg-white border-[#E8E0D5]">
              <CardHeader>
                <CardTitle className="text-[#2D2825] text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#2D2825] whitespace-pre-line">
                  {shipment.notes}
                </p>
              </CardContent>
            </Card>
          )}

          <ShipmentDocumentsManager
            shipmentId={shipment.id}
            documents={shipment.documents}
          />
        </div>
      </div>

      {carriers.length === 0 && (
        <div className="rounded-md p-3 text-xs bg-[#D4A574]/10 border border-[#D4A574]/40 text-[#736B66]">
          แนะนำ: เพิ่ม carrier ในระบบที่หน้า{" "}
          <Link
            href="/merchant/shipping/carriers"
            className="text-[#CC785C] font-medium hover:underline"
          >
            Carriers
          </Link>{" "}
          เพื่อใช้ tracking URL
        </div>
      )}
    </div>
  );
}
