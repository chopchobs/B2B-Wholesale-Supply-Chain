import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { InvoicePDF, type InvoicePDFData } from "@/lib/pdf/InvoicePDF";

// Node.js runtime: @react-pdf/renderer ใช้ Node API ไม่ทำงานบน Edge
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// แปลง Decimal เป็น number
function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

// ผูก payment method enum -> label อ่านง่าย
function methodLabel(method: string): string {
  switch (method) {
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "CREDIT":
      return "Credit";
    case "CASH":
      return "Cash";
    default:
      return method;
  }
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
    // ดึง invoice พร้อม order.items, customer profile, payments
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: {
              include: { customerProfile: true },
            },
            items: {
              include: {
                product: { select: { name: true, sku: true } },
              },
            },
          },
        },
        payments: { orderBy: { paidAt: "desc" } },
      },
    });

    if (!invoice) {
      return Response.json(
        { data: null, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // หา shop name: ใช้ shop ของ product แรก ถ้าไม่มีก็ใช้ default
    const firstShop = await prisma.shop.findFirst({
      orderBy: { createdAt: "asc" },
      select: { name: true },
    });
    const shopName = firstShop?.name ?? "B2B Wholesale";

    // map ข้อมูล customer จาก user.customerProfile (ถ้ามี)
    const profile = invoice.order.user.customerProfile;
    const pdfData: InvoicePDFData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issuedAt,
      dueDate: invoice.dueDate,
      subtotal: dec(invoice.subtotal),
      taxAmount: dec(invoice.tax),
      totalAmount: dec(invoice.total),
      notes: invoice.notes,
      items: invoice.order.items.map(function mapItem(it) {
        return {
          description: `${it.product.name} (${it.product.sku})`,
          quantity: it.quantity,
          unitPrice: dec(it.unitPrice),
          totalPrice: dec(it.subTotal),
        };
      }),
      customer: {
        companyName:
          profile?.companyName ?? invoice.order.user.name ?? null,
        email: invoice.order.user.email,
        phone: null,
        address: profile?.billingAddress ?? null,
      },
      payments: invoice.payments.map(function mapPayment(p) {
        return {
          amount: dec(p.amount),
          paymentDate: p.paidAt,
          paymentMethod: methodLabel(p.method),
        };
      }),
    };

    const buffer = await renderToBuffer(
      <InvoicePDF invoice={pdfData} shopName={shopName} />
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("invoice pdf route failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF";
    return Response.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
