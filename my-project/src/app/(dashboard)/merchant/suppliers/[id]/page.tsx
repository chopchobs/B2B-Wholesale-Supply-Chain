import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  ClipboardList,
} from "lucide-react";
import {
  InboundShipmentStatus,
  PurchaseOrderStatus,
  SupplierStatus,
} from "@prisma/client";

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
import { getSupplierById } from "@/server/actions/suppliers";

export const dynamic = "force-dynamic";

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>;
}

function statusVariant(
  status: SupplierStatus
): "success" | "secondary" {
  return status === SupplierStatus.ACTIVE ? "success" : "secondary";
}

function poStatusVariant(
  status: PurchaseOrderStatus
): "success" | "destructive" | "warning" | "info" | "secondary" {
  switch (status) {
    case PurchaseOrderStatus.RECEIVED:
      return "success";
    case PurchaseOrderStatus.CANCELLED:
      return "destructive";
    case PurchaseOrderStatus.SENT:
    case PurchaseOrderStatus.CONFIRMED:
      return "info";
    case PurchaseOrderStatus.DRAFT:
      return "warning";
    default:
      return "secondary";
  }
}

function shipmentVariant(
  status: InboundShipmentStatus
): "success" | "destructive" | "info" {
  switch (status) {
    case InboundShipmentStatus.DELIVERED:
      return "success";
    case InboundShipmentStatus.DELAYED:
      return "destructive";
    default:
      return "info";
  }
}

function formatTHB(n: number): string {
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export default async function SupplierDetailPage(
  props: SupplierDetailPageProps
): Promise<React.ReactElement> {
  const { id } = await props.params;
  const res = await getSupplierById(id);

  if (res.error === "Supplier not found.") {
    notFound();
  }

  if (!res.data) {
    return (
      <div className="flex-1 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {res.error ?? "Supplier could not be loaded."}
        </div>
      </div>
    );
  }

  const supplier = res.data;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      <div className="flex items-center gap-2">
        <Link href="/merchant/suppliers">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Suppliers
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Truck className="h-7 w-7 text-[#CC785C]" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825]">
            {supplier.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusVariant(supplier.status)}>
              {supplier.status}
            </Badge>
            <span className="text-xs text-[#736B66]">
              {supplier.poCount} purchase orders · last order{" "}
              {formatDate(supplier.lastOrderAt)}
            </span>
          </div>
        </div>
      </div>

      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader>
          <CardTitle className="text-[#2D2825]">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-[#CC785C] mt-0.5" />
            <div>
              <div className="text-xs text-[#736B66]">Contact Person</div>
              <div className="text-[#2D2825]">
                {supplier.contactPerson ?? "—"}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-[#CC785C] mt-0.5" />
            <div>
              <div className="text-xs text-[#736B66]">Email</div>
              <div className="text-[#2D2825]">{supplier.email ?? "—"}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-[#CC785C] mt-0.5" />
            <div>
              <div className="text-xs text-[#736B66]">Phone</div>
              <div className="text-[#2D2825]">{supplier.phone ?? "—"}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Globe className="h-4 w-4 text-[#CC785C] mt-0.5" />
            <div>
              <div className="text-xs text-[#736B66]">Website</div>
              <div className="text-[#2D2825]">{supplier.website ?? "—"}</div>
            </div>
          </div>
          <div className="flex items-start gap-2 md:col-span-2">
            <MapPin className="h-4 w-4 text-[#CC785C] mt-0.5" />
            <div className="flex-1">
              <div className="text-xs text-[#736B66]">Address</div>
              <div className="text-[#2D2825] whitespace-pre-wrap">
                {supplier.address ?? "—"}
              </div>
            </div>
          </div>
          {supplier.notes && (
            <div className="md:col-span-2 pt-3 border-t border-[#E8E0D5]">
              <div className="text-xs text-[#736B66] mb-1">Notes</div>
              <div className="text-[#2D2825] whitespace-pre-wrap">
                {supplier.notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[#2D2825]">
            <ClipboardList className="h-5 w-5 text-[#CC785C]" />
            Purchase Order History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {supplier.purchaseOrders.length === 0 ? (
            <div className="text-sm text-[#736B66] py-6 text-center">
              ยังไม่มีประวัติการสั่งซื้อจาก supplier นี้
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F0E8]">
                  <TableHead>PO #</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-sm">
                      <Link
                        href={`/merchant/purchase-orders/${po.id}`}
                        className="text-[#CC785C] hover:underline"
                      >
                        {po.poNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={poStatusVariant(po.status)}>
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825]">
                      {formatDate(po.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825]">
                      {formatDate(po.expectedDelivery)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#CC785C]">
                      {formatTHB(po.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2D2825]">
            <Truck className="h-5 w-5 text-[#D4A574]" />
            Shipment Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {supplier.shipments.length === 0 ? (
            <div className="text-sm text-[#736B66] py-6 text-center">
              ยังไม่มีบันทึก shipment
            </div>
          ) : (
            <ol className="relative border-l border-[#E8E0D5] ml-3 space-y-4">
              {supplier.shipments.map((sh) => (
                <li key={sh.id} className="ml-4">
                  <div className="absolute w-3 h-3 rounded-full bg-[#CC785C] -left-1.5 border border-white" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#2D2825]">
                      {sh.poNumber}
                    </span>
                    <Badge variant={shipmentVariant(sh.status)}>
                      {sh.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-[#736B66] mt-1">
                    {sh.carrier ?? "Carrier —"}
                    {sh.trackingNumber ? ` · ${sh.trackingNumber}` : ""}
                  </div>
                  <div className="text-xs text-[#736B66]">
                    Shipped {formatDate(sh.shippedAt)} · Received{" "}
                    {formatDate(sh.receivedAt)}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
