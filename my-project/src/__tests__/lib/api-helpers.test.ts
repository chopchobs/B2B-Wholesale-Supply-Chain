import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../mocks/prisma";
import { supabaseMock } from "../mocks/supabase";
import {
  apiSuccess,
  apiError,
  parsePagination,
  requireAuth,
  requireMerchant,
  AuthError,
} from "@/lib/api/helpers";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("apiSuccess", () => {
  it("returns 200 with { data, error: null }", async () => {
    const res = apiSuccess({ hello: "world" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: { hello: "world" }, error: null });
  });

  it("supports custom status code", () => {
    const res = apiSuccess({ id: 1 }, 201);
    expect(res.status).toBe(201);
  });
});

describe("apiError", () => {
  it("returns given status with { data: null, error }", async () => {
    const res = apiError("Bad thing", 400);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ data: null, error: "Bad thing" });
  });
});

describe("parsePagination", () => {
  it("returns defaults when nothing provided", () => {
    const result = parsePagination(new URLSearchParams());
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("computes skip correctly", () => {
    const result = parsePagination(new URLSearchParams("page=3&limit=10"));
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it("caps limit at 100", () => {
    const result = parsePagination(new URLSearchParams("limit=500"));
    expect(result.limit).toBe(100);
  });

  it("falls back to defaults on invalid input", () => {
    const result = parsePagination(new URLSearchParams("page=-1&limit=abc"));
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

describe("requireAuth", () => {
  it("returns context for active user", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      role: "USER",
      isActive: true,
    });

    const ctx = await requireAuth();
    expect(ctx).toEqual({ userId: "user-1", role: "USER" });
  });

  it("throws AuthError 401 when no user", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(requireAuth()).rejects.toBeInstanceOf(AuthError);
    await expect(requireAuth()).rejects.toMatchObject({ status: 401 });
  });

  it("throws AuthError 403 when account disabled", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      role: "USER",
      isActive: false,
    });

    await expect(requireAuth()).rejects.toMatchObject({ status: 403 });
  });
});

describe("requireMerchant", () => {
  it("allows MERCHANT", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: { id: "m1" } },
      error: null,
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "m1",
      role: "MERCHANT",
      isActive: true,
    });

    const ctx = await requireMerchant();
    expect(ctx.userId).toBe("m1");
  });

  it("rejects USER role with 403", async () => {
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      role: "USER",
      isActive: true,
    });

    await expect(requireMerchant()).rejects.toMatchObject({ status: 403 });
  });
});
