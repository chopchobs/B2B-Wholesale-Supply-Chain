import React from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Truck } from "lucide-react";
import { PurchaseOrderStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getPurchaseOrders } from "@/server/actions/purchaseOrders";
import { PurchaseOrderTableClient } from "@/components/merchant/PurchaseOrderTableClient";
import {
  CreatePurchaseOrderDialog,
  type ProductOption,
  type SupplierOption,
} from "@/components/merchant/CreatePurchaseOrderDialog";

export const dynamic = "force-dynamic";

interface PurchaseOrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type FilterValue = "ALL" | PurchaseOrderStatus;

function parseFilter(value: string | undefined): FilterValue {
  if (
    value === "DRAFT" ||
    value === "SENT" ||
    value === "CONFIRMED" ||
    value === "RECEIVED" ||
    value === "CANCELLED"
  ) {
    return value;
  }
  return "ALL";
}

export default async function MerchantPurchaseOrdersPage(
  props: PurchaseOrdersPageProps
): Promise<React.ReactElement> {
  const params = await props.searchParams;
  const filter = parseFilter(
    typeof params.status === "string" ? params.status : undefined
  );

  // ดึง suppliers (ACTIVE) และ products (active) สำหรับฟอร์มสร้าง PO
  const [poRes, suppliers, products] = await Promise.all([
    getPurchaseOrders(),
    prisma.supplier.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true, basePrice: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const purchaseOrders = poRes.data ?? [];
  const supplierOptions: SupplierOption[] = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
  }));
  const productOptions: ProductOption[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    basePrice: Number(p.basePrice),
  }));

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
            <ClipboardList className="h-7 w-7 text-[#CC785C]" />
            Purchase Orders
          </h1>
          <p className="text-[#736B66] mt-1">
            สร้างและติดตามใบสั่งซื้อจาก supplier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/merchant/suppliers">
            <Button
              variant="outline"
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
            >
              <Truck className="mr-2 h-4 w-4 text-[#CC785C]" />
              Suppliers
            </Button>
          </Link>
          <CreatePurchaseOrderDialog
            suppliers={supplierOptions}
            products={productOptions}
          />
        </div>
      </div>

      {poRes.error && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {poRes.error}
        </div>
      )}

      <PurchaseOrderTableClient
        purchaseOrders={purchaseOrders}
        initialFilter={filter}
      />
    </div>
  );
}
