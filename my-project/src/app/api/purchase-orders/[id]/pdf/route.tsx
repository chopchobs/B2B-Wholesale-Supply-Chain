import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  PurchaseOrderPDF,
  type PurchaseOrderPDFData,
} from "@/lib/pdf/PurchaseOrderPDF";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<Response> {
  const { id } = await context.params;

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });

    if (!po) {
      return Response.json(
        { data: null, error: "Purchase order not found" },
        { status: 404 }
      );
    }

    // ใช้ shop แรกในระบบเป็น "Ship To"
    const firstShop = await prisma.shop.findFirst({
      orderBy: { createdAt: "asc" },
      select: { name: true },
    });
    const shopName = firstShop?.name ?? "B2B Wholesale";

    // ดึงที่อยู่ของ warehouse default (ถ้ามี) มาแสดงเป็น ship-to address
    const defaultWarehouse = await prisma.warehouse.findFirst({
      where: { isDefault: true, isActive: true },
      select: { address: true, city: true, country: true },
    });
    const shopAddress = defaultWarehouse
      ? [
          defaultWarehouse.address,
          defaultWarehouse.city,
          defaultWarehouse.country,
        ]
          .filter(Boolean)
          .join(", ") || null
      : null;

    const pdfData: PurchaseOrderPDFData = {
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      orderDate: po.createdAt,
      expectedDelivery: po.expectedDelivery,
      totalAmount: dec(po.total),
      notes: po.notes,
      items: po.items.map(function mapItem(it) {
        return {
          productName: it.product.name,
          sku: it.product.sku,
          quantity: it.quantity,
          unitCost: dec(it.unitCost),
          totalCost: dec(it.total),
        };
      }),
      supplier: po.supplier
        ? {
            name: po.supplier.name,
            email: po.supplier.email,
            phone: po.supplier.phone,
            address: po.supplier.address,
          }
        : null,
    };

    const buffer = await renderToBuffer(
      <PurchaseOrderPDF
        po={pdfData}
        shopName={shopName}
        shopAddress={shopAddress}
      />
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="po-${po.poNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("po pdf route failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF";
    return Response.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
