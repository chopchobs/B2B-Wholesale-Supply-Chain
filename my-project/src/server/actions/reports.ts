"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface DateRangeInput {
  from?: Date | string | null;
  to?: Date | string | null;
}

export type ReportPeriod = "daily" | "weekly" | "monthly";

export interface SalesReportRow {
  period: string; // ISO date string (yyyy-mm-dd) or week / month bucket
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
}

export interface SalesReportSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  rows: SalesReportRow[];
}

export interface TopProductRow {
  productId: string;
  sku: string;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface OrderStatusBreakdownRow {
  status: OrderStatus;
  count: number;
}

export interface RevenueTrendPoint {
  period: string;
  revenue: number;
}

export interface InventoryReport {
  totalSkus: number;
  lowStockCount: number;
  outOfStockCount: number;
  estimatedStockValue: number;
}

export interface TopCustomerRow {
  userId: string;
  name: string | null;
  email: string;
  orderCount: number;
  totalSpend: number;
}

// --- Helpers ---

// แปลง input เป็น Date ที่ถูกต้อง รองรับทั้ง string และ Date
function toDate(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

// สร้าง where condition สำหรับช่วงวันที่ + สถานะที่นับเป็นรายได้
function buildOrderWhere(
  range?: DateRangeInput,
  excludeCancelled = true
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  const from = toDate(range?.from);
  const to = toDate(range?.to);
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }
  if (excludeCancelled) {
    where.status = { not: OrderStatus.CANCELLED };
  }
  return where;
}

// แปลง Decimal ของ Prisma เป็น number อย่างปลอดภัย
function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

// คำนวณ key bucket ตาม period
function bucketKey(date: Date, period: ReportPeriod): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  if (period === "monthly") {
    return `${y}-${m}`;
  }
  if (period === "weekly") {
    // หา ISO week-ish: ใช้วันจันทร์เป็นต้นสัปดาห์
    const tmp = new Date(Date.UTC(y, date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(
      ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
    return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  }
  return `${y}-${m}-${d}`;
}

// --- Queries ---

export async function getSalesReport(
  range?: DateRangeInput,
  period: ReportPeriod = "daily"
): Promise<ActionResult<SalesReportSummary>> {
  try {
    const where = buildOrderWhere(range, true);

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // จัดกลุ่มยอดขายตามช่วงเวลา
    const bucketMap = new Map<
      string,
      { revenue: number; orderCount: number }
    >();
    let totalRevenue = 0;
    for (const o of orders) {
      const amount = dec(o.totalAmount);
      totalRevenue += amount;
      const key = bucketKey(o.createdAt, period);
      const prev = bucketMap.get(key) ?? { revenue: 0, orderCount: 0 };
      bucketMap.set(key, {
        revenue: prev.revenue + amount,
        orderCount: prev.orderCount + 1,
      });
    }

    const rows: SalesReportRow[] = Array.from(bucketMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([period, v]) => ({
        period,
        revenue: v.revenue,
        orderCount: v.orderCount,
        avgOrderValue: v.orderCount > 0 ? v.revenue / v.orderCount : 0,
      }));

    const totalOrders = orders.length;
    return {
      data: {
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        rows,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("getSalesReport failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load sales report.";
    return { data: null, error: message };
  }
}

export async function getTopProducts(
  limit = 10,
  range?: DateRangeInput
): Promise<ActionResult<TopProductRow[]>> {
  try {
    const where = buildOrderWhere(range, true);

    // ดึง OrderItem ทั้งหมดที่อยู่ใน Order ตามช่วง
    const items = await prisma.orderItem.findMany({
      where: { order: where },
      select: {
        productId: true,
        quantity: true,
        subTotal: true,
        product: { select: { sku: true, name: true } },
      },
    });

    const aggMap = new Map<string, TopProductRow>();
    for (const it of items) {
      const prev = aggMap.get(it.productId);
      if (prev) {
        prev.unitsSold += it.quantity;
        prev.revenue += dec(it.subTotal);
      } else {
        aggMap.set(it.productId, {
          productId: it.productId,
          sku: it.product.sku,
          name: it.product.name,
          unitsSold: it.quantity,
          revenue: dec(it.subTotal),
        });
      }
    }

    const rows = Array.from(aggMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, Math.max(1, limit));

    return { data: rows, error: null };
  } catch (error: unknown) {
    console.error("getTopProducts failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load top products.";
    return { data: null, error: message };
  }
}

export async function getOrderStatusBreakdown(
  range?: DateRangeInput
): Promise<ActionResult<OrderStatusBreakdownRow[]>> {
  try {
    const where = buildOrderWhere(range, false);

    const grouped = await prisma.order.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });

    // กำหนดให้ทุกสถานะมีค่า (เผื่อกรณีไม่มีออร์เดอร์ในสถานะนั้น)
    const statusOrder: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];
    const map = new Map<OrderStatus, number>();
    for (const g of grouped) {
      map.set(g.status, g._count._all);
    }
    const rows: OrderStatusBreakdownRow[] = statusOrder.map((s) => ({
      status: s,
      count: map.get(s) ?? 0,
    }));

    return { data: rows, error: null };
  } catch (error: unknown) {
    console.error("getOrderStatusBreakdown failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load order status breakdown.";
    return { data: null, error: message };
  }
}

export async function getRevenueByPeriod(
  period: ReportPeriod = "daily",
  range?: DateRangeInput
): Promise<ActionResult<RevenueTrendPoint[]>> {
  try {
    const where = buildOrderWhere(range, true);
    const orders = await prisma.order.findMany({
      where,
      select: { createdAt: true, totalAmount: true },
      orderBy: { createdAt: "asc" },
    });

    const map = new Map<string, number>();
    for (const o of orders) {
      const key = bucketKey(o.createdAt, period);
      map.set(key, (map.get(key) ?? 0) + dec(o.totalAmount));
    }

    const data: RevenueTrendPoint[] = Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([period, revenue]) => ({ period, revenue }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getRevenueByPeriod failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load revenue trend.";
    return { data: null, error: message };
  }
}

export async function getInventoryReport(): Promise<
  ActionResult<InventoryReport>
> {
  try {
    // ดึง inventory + basePrice ของ product เพื่อประเมินมูลค่าสต็อก
    const items = await prisma.inventoryItem.findMany({
      select: {
        quantity: true,
        lowStockThreshold: true,
        product: { select: { basePrice: true } },
      },
    });

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let estimatedStockValue = 0;
    for (const i of items) {
      if (i.quantity <= 0) outOfStockCount += 1;
      else if (i.quantity <= i.lowStockThreshold) lowStockCount += 1;
      estimatedStockValue += i.quantity * dec(i.product.basePrice);
    }

    return {
      data: {
        totalSkus: items.length,
        lowStockCount,
        outOfStockCount,
        estimatedStockValue,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("getInventoryReport failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load inventory report.";
    return { data: null, error: message };
  }
}

export async function getCustomerReport(
  limit = 10,
  range?: DateRangeInput
): Promise<ActionResult<TopCustomerRow[]>> {
  try {
    const where = buildOrderWhere(range, true);

    // group ตาม userId
    const grouped = await prisma.order.groupBy({
      by: ["userId"],
      where,
      _count: { _all: true },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: Math.max(1, limit),
    });

    if (grouped.length === 0) {
      return { data: [], error: null };
    }

    const users = await prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const rows: TopCustomerRow[] = grouped.map((g) => {
      const u = userMap.get(g.userId);
      return {
        userId: g.userId,
        name: u?.name ?? null,
        email: u?.email ?? "unknown",
        orderCount: g._count._all,
        totalSpend: dec(g._sum.totalAmount),
      };
    });

    return { data: rows, error: null };
  } catch (error: unknown) {
    console.error("getCustomerReport failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load customer report.";
    return { data: null, error: message };
  }
}
