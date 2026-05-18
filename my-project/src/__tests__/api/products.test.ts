import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../mocks/prisma";
import { supabaseMock } from "../mocks/supabase";
import { GET, POST } from "@/app/api/products/route";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(url: string, init?: RequestInit): import("next/server").NextRequest {
  // NextRequest extends Request — cast via unknown ก็พอสำหรับ test
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

describe("GET /api/products", () => {
  it("returns paginated list with defaults", async () => {
    prismaMock.product.findMany.mockResolvedValue([{ id: "p1", name: "P1" }]);
    prismaMock.product.count.mockResolvedValue(1);

    const res = await GET(makeRequest("http://localhost/api/products"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.page).toBe(1);
    expect(body.data.limit).toBe(20);
  });

  it("applies search filter with case-insensitive contains", async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);

    await GET(makeRequest("http://localhost/api/products?search=Electronics"));

    const call = prismaMock.product.findMany.mock.calls[0]![0];
    expect(call.where.OR).toEqual([
      { name: { contains: "Electronics", mode: "insensitive" } },
      { sku: { contains: "Electronics", mode: "insensitive" } },
    ]);
  });

  it("uses skip = (page-1) * limit", async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);

    await GET(makeRequest("http://localhost/api/products?page=2&limit=5"));

    const call = prismaMock.product.findMany.mock.calls[0]![0];
    expect(call.skip).toBe(5);
    expect(call.take).toBe(5);
  });
});

describe("POST /api/products", () => {
  it("returns 401 without auth", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const res = await POST(
      makeRequest("http://localhost/api/products", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(401);
  });

  it("creates product as MERCHANT with valid body", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: { id: "m1" } },
      error: null,
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "m1",
      role: "MERCHANT",
      isActive: true,
    });
    prismaMock.product.create.mockResolvedValue({ id: "new-p", name: "Widget" });

    const res = await POST(
      makeRequest("http://localhost/api/products", {
        method: "POST",
        body: JSON.stringify({
          name: "Widget",
          sku: "WID-001",
          basePrice: 100,
          shopId: "shop-1",
        }),
      })
    );

    expect(res.status).toBe(201);
    expect(prismaMock.product.create).toHaveBeenCalled();
  });

  it("returns 422 for invalid body (missing name)", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: { id: "m1" } },
      error: null,
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "m1",
      role: "MERCHANT",
      isActive: true,
    });

    const res = await POST(
      makeRequest("http://localhost/api/products", {
        method: "POST",
        body: JSON.stringify({ sku: "X", basePrice: 1, shopId: "s" }),
      })
    );
    expect(res.status).toBe(422);
  });
});
