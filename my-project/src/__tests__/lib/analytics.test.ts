import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../mocks/prisma";
import {
  getKPISummary,
  getRevenueByDay,
  getTopProducts,
  getRecentOrders,
  getLowStockItems,
} from "@/lib/analytics";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getKPISummary", () => {
  it("returns aggregated KPI shape", async () => {
    prismaMock.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 1000 } });
    prismaMock.order.count.mockResolvedValue(4);
    prismaMock.order.findMany.mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
    ]);
    prismaMock.inventoryItem.count.mockResolvedValue(3);
    prismaMock.returnRequest.count.mockResolvedValue(2);

    const result = await getKPISummary();

    expect(result).toEqual({
      totalRevenue: 1000,
      totalOrders: 4,
      avgOrderValue: 250,
      activeCustomers: 2,
      lowStockCount: 3,
      pendingReturns: 2,
    });
  });

  it("returns defaults when Prisma throws", async () => {
    prismaMock.order.aggregate.mockRejectedValue(new Error("db down"));
    prismaMock.order.count.mockResolvedValue(0);
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.inventoryItem.count.mockResolvedValue(0);
    prismaMock.returnRequest.count.mockResolvedValue(0);

    const result = await getKPISummary();
    expect(result.totalRevenue).toBe(0);
    expect(result.totalOrders).toBe(0);
  });
});

describe("getRevenueByDay", () => {
  it("returns 30 consecutive day buckets", async () => {
    prismaMock.order.findMany.mockResolvedValue([]);

    const result = await getRevenueByDay(30);
    expect(result).toHaveLength(30);

    // ตรวจว่าวันต่อเนื่องกัน
    for (let i = 1; i < result.length; i++) {
      const prev = new Date(result[i - 1]!.date + "T00:00:00Z").getTime();
      const cur = new Date(result[i]!.date + "T00:00:00Z").getTime();
      expect(cur - prev).toBe(24 * 60 * 60 * 1000);
    }
  });

  it("accumulates revenue into matching day", async () => {
    const today = new Date();
    prismaMock.order.findMany.mockResolvedValue([
      { totalAmount: 100, createdAt: today },
      { totalAmount: 50, createdAt: today },
    ]);

    const result = await getRevenueByDay(7);
    const lastDay = result[result.length - 1]!;
    expect(lastDay.revenue).toBe(150);
  });
});

describe("getTopProducts", () => {
  it("returns sorted top products limited to N", async () => {
    prismaMock.orderItem.groupBy.mockResolvedValue([
      { productId: "p1", _sum: { subTotal: 500, quantity: 5 } },
      { productId: "p2", _sum: { subTotal: 300, quantity: 3 } },
    ]);
    prismaMock.product.findMany.mockResolvedValue([
      { id: "p1", name: "Product One" },
      { id: "p2", name: "Product Two" },
    ]);

    const result = await getTopProducts(5);
    expect(result).toHaveLength(2);
    expect(result[0]!.name).toBe("Product One");
    expect(result[0]!.revenue).toBe(500);
    expect(result[1]!.unitsSold).toBe(3);
  });

  it("returns empty array if no orderItems", async () => {
    prismaMock.orderItem.groupBy.mockResolvedValue([]);
    const result = await getTopProducts(5);
    expect(result).toEqual([]);
  });
});

describe("getRecentOrders", () => {
  it("prefers companyName > user.name > email", async () => {
    prismaMock.order.findMany.mockResolvedValue([
      {
        id: "o1",
        totalAmount: 100,
        status: "PENDING",
        createdAt: new Date(),
        user: {
          name: "John",
          email: "john@x.com",
          customerProfile: { companyName: "Acme Co." },
        },
      },
      {
        id: "o2",
        totalAmount: 200,
        status: "PENDING",
        createdAt: new Date(),
        user: { name: "Jane", email: "jane@x.com", customerProfile: null },
      },
      {
        id: "o3",
        totalAmount: 300,
        status: "PENDING",
        createdAt: new Date(),
        user: { name: null, email: "e@x.com", customerProfile: null },
      },
    ]);

    const result = await getRecentOrders(10);
    expect(result[0]!.customerName).toBe("Acme Co.");
    expect(result[1]!.customerName).toBe("Jane");
    expect(result[2]!.customerName).toBe("e@x.com");
  });
});

describe("getLowStockItems", () => {
  it("returns only items where quantity <= lowStockThreshold", async () => {
    prismaMock.inventoryItem.findMany.mockResolvedValue([
      {
        quantity: 2,
        lowStockThreshold: 10,
        product: { name: "Low Item", sku: "SKU-LOW" },
      },
      {
        quantity: 50,
        lowStockThreshold: 10,
        product: { name: "OK Item", sku: "SKU-OK" },
      },
      {
        quantity: 5,
        lowStockThreshold: 5,
        product: { name: "Edge Item", sku: "SKU-EDGE" },
      },
    ]);

    const result = await getLowStockItems(10);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.sku)).toEqual(["SKU-LOW", "SKU-EDGE"]);
  });
});
