import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../mocks/prisma";
import { supabaseMock } from "../mocks/supabase";
import { PUT } from "@/app/api/orders/[id]/status/route";

beforeEach(() => {
  vi.clearAllMocks();
  // เป็น MERCHANT default
  supabaseMock.auth.getUser.mockResolvedValue({
    data: { user: { id: "m1" } },
    error: null,
  });
  prismaMock.user.findUnique.mockResolvedValue({
    id: "m1",
    role: "MERCHANT",
    isActive: true,
  });
});

function makeRequest(body: unknown): import("next/server").NextRequest {
  return new Request("http://localhost/api/orders/abc/status", {
    method: "PUT",
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function makeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PUT /api/orders/[id]/status", () => {
  it("allows PENDING → PROCESSING", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: "o1", status: "PENDING" });
    prismaMock.order.update.mockResolvedValue({ id: "o1", status: "PROCESSING" });

    const res = await PUT(makeRequest({ status: "PROCESSING" }), makeCtx("o1"));
    expect(res.status).toBe(200);
    expect(prismaMock.order.update).toHaveBeenCalled();
  });

  it("rejects DELIVERED → PENDING with 400", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: "o1", status: "DELIVERED" });

    const res = await PUT(makeRequest({ status: "PENDING" }), makeCtx("o1"));
    expect(res.status).toBe(400);
  });

  it("rejects CANCELLED → anything with 400", async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: "o1", status: "CANCELLED" });

    const res = await PUT(makeRequest({ status: "PROCESSING" }), makeCtx("o1"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when order not found", async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    const res = await PUT(makeRequest({ status: "PROCESSING" }), makeCtx("missing"));
    expect(res.status).toBe(404);
  });

  it("returns 422 on invalid status enum", async () => {
    const res = await PUT(makeRequest({ status: "WAT" }), makeCtx("o1"));
    expect(res.status).toBe(422);
  });
});
