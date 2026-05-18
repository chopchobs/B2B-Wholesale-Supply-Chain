import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../mocks/prisma";
import { supabaseMock } from "../mocks/supabase";
import { GET, POST } from "@/app/api/orders/route";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(url: string, init?: RequestInit): import("next/server").NextRequest {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

function mockAuth(role: "USER" | "MERCHANT" | "ADMIN", userId = "u1") {
  supabaseMock.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    role,
    isActive: true,
  });
}

describe("GET /api/orders", () => {
  it("MERCHANT sees all orders (no userId filter)", async () => {
    mockAuth("MERCHANT", "m1");
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.order.count.mockResolvedValue(0);

    await GET(makeRequest("http://localhost/api/orders"));

    const call = prismaMock.order.findMany.mock.calls[0]![0];
    expect(call.where.userId).toBeUndefined();
  });

  it("USER sees only their own orders", async () => {
    mockAuth("USER", "user-A");
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.order.count.mockResolvedValue(0);

    await GET(makeRequest("http://localhost/api/orders"));

    const call = prismaMock.order.findMany.mock.calls[0]![0];
    expect(call.where.userId).toBe("user-A");
  });
});

describe("POST /api/orders", () => {
  it("creates order with valid items", async () => {
    mockAuth("USER", "u1");
    prismaMock.product.findMany.mockResolvedValue([
      { id: "p1", basePrice: 50, priceTiers: [] },
    ]);
    prismaMock.$transaction.mockImplementation(async (fn: unknown) => {
      // จำลอง tx → ส่ง prismaMock เป็น tx
      if (typeof fn === "function") {
        return (fn as (tx: typeof prismaMock) => Promise<unknown>)({
          ...prismaMock,
          order: {
            ...prismaMock.order,
            create: vi.fn().mockResolvedValue({ id: "new-order" }),
          },
        } as unknown as typeof prismaMock);
      }
      return { id: "new-order" };
    });

    const res = await POST(
      makeRequest("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ items: [{ productId: "p1", quantity: 2 }] }),
      })
    );

    expect(res.status).toBe(201);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it("returns 422 for empty items", async () => {
    mockAuth("USER", "u1");

    const res = await POST(
      makeRequest("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ items: [] }),
      })
    );

    expect(res.status).toBe(422);
  });
});
