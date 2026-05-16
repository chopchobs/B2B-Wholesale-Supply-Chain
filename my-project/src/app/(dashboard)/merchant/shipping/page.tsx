import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Plus,
  Building2,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getShipmentSummary,
  getShipments,
} from "@/server/actions/shipments";

export const dynamic = "force-dynamic";

function getStatusBadgeVariant(status: string): "success" | "destructive" | "warning" | "info" | "default" {
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

export default async function ShippingDashboardPage(): Promise<React.ReactElement> {
  const [summaryRes, shipmentsRes] = await Promise.all([
    getShipmentSummary(),
    getShipments(),
  ]);

  const summary =
    summaryRes.data ?? {
      totalShipments: 0,
      pending: 0,
      inTransit: 0,
      delivered: 0,
      failed: 0,
      totalCost: 0,
    };

  const shipments = (shipmentsRes.data ?? []).slice(0, 8);
  const loadError = summaryRes.error ?? shipmentsRes.error;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      <div className="flex items-center gap-2">
        <Link href="/merchant">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
            <Truck className="h-7 w-7 text-[#CC785C]" />
            Shipping & Logistics
          </h1>
          <p className="text-[#736B66] mt-1">
            จัดการการจัดส่งสินค้า ผู้ขนส่ง และเรทค่าบริการทั้งหมด
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/merchant/shipping/carriers">
            <Button
              variant="outline"
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
            >
              <Building2 className="mr-2 h-4 w-4 text-[#CC785C]" />
              Carriers
            </Button>
          </Link>
          <Link href="/merchant/shipping/rates">
            <Button
              variant="outline"
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
            >
              <Layers className="mr-2 h-4 w-4 text-[#D4A574]" />
              Rates & Zones
            </Button>
          </Link>
          <Link href="/merchant/shipping/shipments">
            <Button className="bg-[#CC785C] text-white hover:bg-[#B86548]">
              <Plus className="mr-2 h-4 w-4" />
              New Shipment
            </Button>
          </Link>
        </div>
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Total Shipments
            </CardTitle>
            <Package className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {summary.totalShipments}
            </div>
            <p className="text-xs text-[#736B66] mt-1">Lifetime shipments</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#D4A574]">
              {summary.pending}
            </div>
            <p className="text-xs text-[#736B66] mt-1">รอจัดส่ง</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              In Transit
            </CardTitle>
            <Truck className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#CC785C]">
              {summary.inTransit}
            </div>
            <p className="text-xs text-[#736B66] mt-1">กำลังจัดส่ง</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Delivered
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[#D4A574]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              {summary.delivered}
            </div>
            <p className="text-xs text-[#736B66] mt-1">ส่งสำเร็จ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#736B66]">
              Shipping Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-[#CC785C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D2825]">
              ฿
              {summary.totalCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-[#736B66] mt-1">รวมทั้งหมด</p>
          </CardContent>
        </Card>
      </div>

      {summary.failed > 0 && (
        <div className="rounded-md p-4 bg-[#CC785C]/10 border border-[#CC785C]/40 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#CC785C]" />
          <span className="text-[#2D2825] text-sm">
            มี shipment ที่ส่งไม่สำเร็จ{" "}
            <span className="font-bold text-[#CC785C]">{summary.failed}</span>{" "}
            รายการ — ตรวจสอบและดำเนินการเพิ่มเติม
          </span>
        </div>
      )}

      {/* Recent Shipments */}
      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-[#2D2825]">Recent Shipments</CardTitle>
            <p className="text-sm text-[#736B66]">
              shipment ล่าสุด {shipments.length} รายการ
            </p>
          </div>
          <Link href="/merchant/shipping/shipments">
            <Button
              variant="outline"
              size="sm"
              className="border-[#E8E0D5] text-[#CC785C] hover:bg-[#F5F0E8]"
            >
              View All →
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {shipments.length === 0 ? (
            <div className="text-center py-12 text-[#736B66] text-sm">
              ยังไม่มี shipment ในระบบ
            </div>
          ) : (
            <div className="rounded-md border border-[#E8E0D5] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F5F0E8] hover:bg-[#F5F0E8]">
                    <TableHead className="text-[#736B66]">Shipment #</TableHead>
                    <TableHead className="text-[#736B66]">Customer</TableHead>
                    <TableHead className="text-[#736B66]">Carrier</TableHead>
                    <TableHead className="text-[#736B66]">Tracking</TableHead>
                    <TableHead className="text-[#736B66]">Status</TableHead>
                    <TableHead className="text-right text-[#736B66]">
                      Cost
                    </TableHead>
                    <TableHead className="text-right text-[#736B66]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((s) => (
                    <TableRow key={s.id} className="hover:bg-[#F5F0E8]/40">
                      <TableCell className="font-mono text-xs text-[#2D2825]">
                        {s.shipmentNumber}
                      </TableCell>
                      <TableCell className="text-[#2D2825]">
                        {s.shipToName}
                      </TableCell>
                      <TableCell className="text-[#736B66] text-sm">
                        {s.carrierName ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-[#736B66]">
                        {s.trackingNumber ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(s.status)}>
                          {s.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-[#2D2825]">
                        ฿
                        {s.shippingCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/merchant/shipping/shipments/${s.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#E8E0D5] text-[#CC785C] hover:bg-[#F5F0E8] h-7 text-xs"
                          >
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
