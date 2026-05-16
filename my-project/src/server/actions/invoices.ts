"use server";

import { prisma } from "@/lib/prisma";
import {
  InvoiceStatus,
  PaymentMethod,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issuedAt: Date;
  dueDate: Date;
  paidAt: Date | null;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  orderId: string;
  order: {
    id: string;
    totalAmount: number;
    status: string;
    user: { id: string; name: string | null; email: string };
  };
}

export interface InvoicePaymentItem {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: Date;
  note: string | null;
}

export interface InvoiceDetail extends InvoiceListItem {
  payments: InvoicePaymentItem[];
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
    product: { name: string; sku: string };
  }>;
  totalPaid: number;
  balanceDue: number;
}

export interface InvoiceSummary {
  totalOutstanding: number;
  totalPaidThisMonth: number;
  overdueCount: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
}

export interface RecordPaymentInput {
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  note?: string | null;
}

// --- Helpers ---

// แปลง Decimal เป็น number อย่างปลอดภัย
function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

// สร้างเลขที่ใบแจ้งหนี้รูปแบบ INV-YYYYMM-XXXX (sequence รายเดือน)
async function generateInvoiceNumber(now: Date = new Date()): Promise<string> {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `INV-${y}${m}-`;

  // หาเลขล่าสุดของเดือนเดียวกัน
  const last = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let nextSeq = 1;
  if (last?.invoiceNumber) {
    const tail = last.invoiceNumber.slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (!Number.isNaN(parsed)) nextSeq = parsed + 1;
  }
  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// แปลง invoice raw -> listItem (serialize Decimal)
function toListItem(
  inv: Prisma.InvoiceGetPayload<{
    include: {
      order: {
        include: {
          user: { select: { id: true; name: true; email: true } };
        };
      };
    };
  }>
): InvoiceListItem {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    status: inv.status,
    issuedAt: inv.issuedAt,
    dueDate: inv.dueDate,
    paidAt: inv.paidAt,
    subtotal: dec(inv.subtotal),
    tax: dec(inv.tax),
    total: dec(inv.total),
    notes: inv.notes,
    orderId: inv.orderId,
    order: {
      id: inv.order.id,
      totalAmount: dec(inv.order.totalAmount),
      status: inv.order.status,
      user: {
        id: inv.order.user.id,
        name: inv.order.user.name,
        email: inv.order.user.email,
      },
    },
  };
}

// --- Queries ---

export async function getInvoices(
  filter?: { status?: InvoiceStatus | "ALL" }
): Promise<ActionResult<InvoiceListItem[]>> {
  try {
    const where: Prisma.InvoiceWhereInput = {};
    if (filter?.status && filter.status !== "ALL") {
      where.status = filter.status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return { data: invoices.map(toListItem), error: null };
  } catch (error: unknown) {
    console.error("getInvoices failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load invoices.";
    return { data: null, error: message };
  }
}

export async function getInvoiceById(
  id: string
): Promise<ActionResult<InvoiceDetail>> {
  try {
    const inv = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
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

    if (!inv) {
      return { data: null, error: "Invoice not found." };
    }

    const totalPaid = inv.payments.reduce((s, p) => s + dec(p.amount), 0);
    const total = dec(inv.total);

    const base = toListItem(inv);

    const detail: InvoiceDetail = {
      ...base,
      items: inv.order.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: dec(it.unitPrice),
        subTotal: dec(it.subTotal),
        product: { name: it.product.name, sku: it.product.sku },
      })),
      payments: inv.payments.map((p) => ({
        id: p.id,
        amount: dec(p.amount),
        method: p.method,
        reference: p.reference,
        paidAt: p.paidAt,
        note: p.note,
      })),
      totalPaid,
      balanceDue: Math.max(0, total - totalPaid),
    };

    return { data: detail, error: null };
  } catch (error: unknown) {
    console.error("getInvoiceById failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load invoice.";
    return { data: null, error: message };
  }
}

// อัตราภาษีเริ่มต้น (VAT 7%) — ปรับได้ผ่าน ENV
function getTaxRate(): number {
  const raw = process.env.INVOICE_TAX_RATE;
  if (!raw) return 0.07;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0.07;
}

export async function createInvoice(
  orderId: string
): Promise<ActionResult<InvoiceListItem>> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        invoice: true,
        items: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      return { data: null, error: "Order not found." };
    }
    if (order.invoice) {
      return {
        data: null,
        error: `Invoice already exists for this order (${order.invoice.invoiceNumber}).`,
      };
    }

    // คำนวณ subtotal จากผลรวม line item เพื่อความถูกต้อง
    const subtotal = order.items.reduce((s, it) => s + dec(it.subTotal), 0);
    const taxRate = getTaxRate();
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const now = new Date();
    const invoiceNumber = await generateInvoiceNumber(now);
    const dueDate = addDays(now, 30);

    const created = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        status: InvoiceStatus.DRAFT,
        issuedAt: now,
        dueDate,
        subtotal: new Prisma.Decimal(subtotal),
        tax: new Prisma.Decimal(tax),
        total: new Prisma.Decimal(total),
      },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    revalidatePath("/merchant/invoices");
    revalidatePath("/merchant");
    return { data: toListItem(created), error: null };
  } catch (error: unknown) {
    console.error("createInvoice failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create invoice.";
    return { data: null, error: message };
  }
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<ActionResult<InvoiceListItem>> {
  try {
    const data: Prisma.InvoiceUpdateInput = { status };
    if (status === InvoiceStatus.PAID) {
      data.paidAt = new Date();
    } else {
      // ถ้าเปลี่ยนกลับจาก PAID เป็นสถานะอื่น ให้ล้าง paidAt
      data.paidAt = null;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data,
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    revalidatePath("/merchant/invoices");
    revalidatePath(`/merchant/invoices/${id}`);
    revalidatePath("/merchant");
    return { data: toListItem(updated), error: null };
  } catch (error: unknown) {
    console.error("updateInvoiceStatus failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update invoice status.";
    return { data: null, error: message };
  }
}

export async function recordPayment(
  invoiceId: string,
  data: RecordPaymentInput
): Promise<ActionResult<InvoicePaymentItem>> {
  try {
    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      return { data: null, error: "Payment amount must be greater than 0." };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) {
      return { data: null, error: "Invoice not found." };
    }
    if (invoice.status === InvoiceStatus.CANCELLED) {
      return { data: null, error: "Cannot record payment on cancelled invoice." };
    }

    // บันทึก payment + อัปเดต status ใน transaction
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.paymentRecord.create({
        data: {
          invoiceId,
          amount: new Prisma.Decimal(data.amount),
          method: data.method,
          reference: data.reference ?? null,
          note: data.note ?? null,
        },
      });

      const totalPaid =
        invoice.payments.reduce((s, p) => s + dec(p.amount), 0) + data.amount;
      const total = dec(invoice.total);

      // ถ้าจ่ายครบ ให้ mark PAID อัตโนมัติ
      if (totalPaid >= total - 0.001) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: InvoiceStatus.PAID, paidAt: new Date() },
        });
      } else if (invoice.status === InvoiceStatus.DRAFT) {
        // ถ้ายัง DRAFT แต่มีการจ่ายแล้ว ให้ขยับเป็น SENT
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: InvoiceStatus.SENT },
        });
      }

      return payment;
    });

    revalidatePath("/merchant/invoices");
    revalidatePath(`/merchant/invoices/${invoiceId}`);
    revalidatePath("/merchant");

    return {
      data: {
        id: result.id,
        amount: dec(result.amount),
        method: result.method,
        reference: result.reference,
        paidAt: result.paidAt,
        note: result.note,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("recordPayment failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to record payment.";
    return { data: null, error: message };
  }
}

export async function getInvoiceSummary(): Promise<ActionResult<InvoiceSummary>> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allInvoices, paidThisMonth] = await Promise.all([
      prisma.invoice.findMany({
        select: { status: true, total: true, dueDate: true },
      }),
      prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.PAID,
          paidAt: { gte: startOfMonth },
        },
        select: { total: true },
      }),
    ]);

    let totalOutstanding = 0;
    let overdueCount = 0;
    let draftCount = 0;
    let sentCount = 0;
    let paidCount = 0;

    for (const inv of allInvoices) {
      const total = dec(inv.total);
      if (inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE) {
        totalOutstanding += total;
      }
      if (inv.status === InvoiceStatus.OVERDUE) {
        overdueCount += 1;
      } else if (inv.status === InvoiceStatus.SENT && inv.dueDate < now) {
        // นับ SENT ที่เลยกำหนดเป็น overdue ด้วย (สำหรับ visibility)
        overdueCount += 1;
      }
      if (inv.status === InvoiceStatus.DRAFT) draftCount += 1;
      if (inv.status === InvoiceStatus.SENT) sentCount += 1;
      if (inv.status === InvoiceStatus.PAID) paidCount += 1;
    }

    const totalPaidThisMonth = paidThisMonth.reduce(
      (s, p) => s + dec(p.total),
      0
    );

    return {
      data: {
        totalOutstanding,
        totalPaidThisMonth,
        overdueCount,
        draftCount,
        sentCount,
        paidCount,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("getInvoiceSummary failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load invoice summary.";
    return { data: null, error: message };
  }
}
