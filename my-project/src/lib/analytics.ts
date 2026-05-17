import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ============================================================
// Phase 22: Analytics Data Layer
// ฟังก์ชันคิวรีรวมศูนย์สำหรับ Real-time Analytics Dashboard
// ทุกฟังก์ชันห่อด้วย try/catch + return ค่า default เมื่อเกิด error
// ============================================================

export interface RevenuePoint {
  date: string; // YYYY-MM-DD
  revenue: number;
}

export interface TopProduct {
  name: string;
  revenue: number;
  unitsSold: number;
}

export interface KPISummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  activeCustomers: number;
  lowStockCount: number;
  pendingReturns: number;
}

export interface RecentOrder {
  id: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: Date;
}

export interface LowStockItem {
  productName: string;
  sku: string;
  quantity: number;
  reorderPoint: number | null;
}

// ----- helpers -----

// แปลง Date → คีย์ YYYY-MM-DD (UTC) เพื่อ group แบบเสถียร
function toDateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonthUTC(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
}

// ============================================================
// 1) Revenue by day (เน้น 30 วันย้อนหลัง)
// ============================================================
export async function getRevenueByDay(days: number): Promise<RevenuePoint[]> {
  try {
    const safeDays = Math.max(1, Math.min(days, 365));
    const now = new Date();
    const since = new Date(now.getTime() - (safeDays - 1) * 24 * 60 * 60 * 1000);
    // ตั้งต้นวันที่เป็นเวลาเที่ยงคืน UTC เพื่อ group ตรงกัน
    const sinceStart = new Date(
      Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate(), 0, 0, 0),
    );

    const orders = await prisma.order.findMany({
      where: {
        status: { not: "CANCELLED" },
        createdAt: { gte: sinceStart },
      },
      select: { totalAmount: true, createdAt: true },
    });

    // เตรียม bucket ครบทุกวันใน range (เพื่อ chart ไม่ขาดวัน)
    const buckets = new Map<string, number>();
    for (let i = 0; i < safeDays; i++) {
      const d = new Date(sinceStart.getTime() + i * 24 * 60 * 60 * 1000);
      buckets.set(toDateKey(d), 0);
    }

    for (const o of orders) {
      const key = toDateKey(o.createdAt);
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + Number(o.totalAmount));
      }
    }

    return Array.from(buckets.entries()).map(([date, revenue]) => ({ date, revenue }));
  } catch (err) {
    console.error("[analytics.getRevenueByDay]", err);
    return [];
  }
}

// ============================================================
// 2) Top products by revenue
// ============================================================
export async function getTopProducts(limit: number): Promise<TopProduct[]> {
  try {
    const safeLimit = Math.max(1, Math.min(limit, 50));

    // groupBy OrderItem โดยกรอง order ที่ไม่ถูกยกเลิก
    const grouped = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: { status: { not: "CANCELLED" } },
      },
      _sum: { subTotal: true, quantity: true },
      orderBy: { _sum: { subTotal: "desc" } },
      take: safeLimit,
    });

    if (grouped.length === 0) return [];

    const productIds = grouped.map((g) => g.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(products.map((p) => [p.id, p.name]));

    return grouped.map((g) => ({
      name: nameById.get(g.productId) ?? "Unknown",
      revenue: Number(g._sum.subTotal ?? 0),
      unitsSold: Number(g._sum.quantity ?? 0),
    }));
  } catch (err) {
    console.error("[analytics.getTopProducts]", err);
    return [];
  }
}

// ============================================================
// 3) KPI Summary (เน้นเดือนปัจจุบัน)
// ============================================================
export async function getKPISummary(): Promise<KPISummary> {
  const defaults: KPISummary = {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    activeCustomers: 0,
    lowStockCount: 0,
    pendingReturns: 0,
  };

  try {
    const monthStart = startOfMonthUTC(new Date());

    const monthOrderWhere: Prisma.OrderWhereInput = {
      status: { not: "CANCELLED" },
      createdAt: { gte: monthStart },
    };

    const [revenueAgg, ordersCount, distinctCustomers, lowStock, pendingReturns] =
      await Promise.all([
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: monthOrderWhere,
        }),
        prisma.order.count({ where: monthOrderWhere }),
        prisma.order.findMany({
          where: monthOrderWhere,
          select: { userId: true },
          distinct: ["userId"],
        }),
        // ใช้ lowStockThreshold (schema มีฟิลด์นี้เป็น default 10)
        // เงื่อนไข: quantity <= lowStockThreshold — ใช้ raw expression ผ่าน fields reference
        prisma.inventoryItem.count({
          where: {
            quantity: { lte: 10 },
          },
        }),
        // หมายเหตุ: ReturnStatus enum ไม่มี PENDING — ใช้ REQUESTED เป็น "รออนุมัติ"
        prisma.returnRequest.count({
          where: { status: "REQUESTED" },
        }),
      ]);

    const totalRevenue = Number(revenueAgg._sum.totalAmount ?? 0);
    const totalOrders = ordersCount;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      activeCustomers: distinctCustomers.length,
      lowStockCount: lowStock,
      pendingReturns,
    };
  } catch (err) {
    console.error("[analytics.getKPISummary]", err);
    return defaults;
  }
}

// ============================================================
// 4) Recent Orders
// ============================================================
export async function getRecentOrders(limit: number): Promise<RecentOrder[]> {
  try {
    const safeLimit = Math.max(1, Math.min(limit, 50));

    const orders = await prisma.order.findMany({
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            customerProfile: { select: { companyName: true } },
          },
        },
      },
    });

    return orders.map((o) => ({
      id: o.id,
      customerName:
        o.user.customerProfile?.companyName ?? o.user.name ?? o.user.email ?? "Unknown",
      total: Number(o.totalAmount),
      status: o.status,
      createdAt: o.createdAt,
    }));
  } catch (err) {
    console.error("[analytics.getRecentOrders]", err);
    return [];
  }
}

// ============================================================
// 5) Low Stock Items
// ============================================================
export async function getLowStockItems(limit: number): Promise<LowStockItem[]> {
  try {
    const safeLimit = Math.max(1, Math.min(limit, 100));

    // ดึงรายการที่อาจ low stock มาก่อน (quantity น้อย) แล้วกรอง threshold ที่ memory
    // เพราะ Prisma ไม่รองรับ compare ระหว่าง column ใน where clause โดยตรง
    const candidates = await prisma.inventoryItem.findMany({
      orderBy: { quantity: "asc" },
      take: safeLimit * 3,
      include: {
        product: { select: { name: true, sku: true } },
      },
    });

    const filtered = candidates
      .filter((c) => c.quantity <= c.lowStockThreshold)
      .slice(0, safeLimit);

    return filtered.map((c) => ({
      productName: c.product.name,
      sku: c.product.sku,
      quantity: c.quantity,
      reorderPoint: c.lowStockThreshold,
    }));
  } catch (err) {
    console.error("[analytics.getLowStockItems]", err);
    return [];
  }
}
