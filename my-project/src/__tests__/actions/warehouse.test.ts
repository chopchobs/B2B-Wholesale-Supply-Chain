import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../mocks/prisma";
import { transferStock } from "@/server/actions/warehouse";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("transferStock", () => {
  it("succeeds when source has enough stock", async () => {
    prismaMock.warehouse.findUnique
      .mockResolvedValueOnce({ id: "wh-A", code: "A", name: "A", isActive: true })
      .mockResolvedValueOnce({ id: "wh-B", code: "B", name: "B", isActive: true });

    prismaMock.$transaction.mockImplementation(async (fn: unknown) => {
      const tx = {
        inventoryItem: {
          findUnique: vi.fn().mockResolvedValue({
            id: "inv-1",
            quantity: 50,
            lowStockThreshold: 10,
          }),
          update: vi.fn().mockResolvedValue({ id: "inv-1" }),
          upsert: vi.fn().mockResolvedValue({ id: "inv-2" }),
        },
        inventoryTransaction: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
      };
      if (typeof fn === "function") {
        return (fn as (t: typeof tx) => Promise<unknown>)(tx);
      }
      return undefined;
    });

    const result = await transferStock({
      fromWarehouseId: "wh-A",
      toWarehouseId: "wh-B",
      productId: "p1",
      quantity: 10,
    });

    expect(result).toEqual({ data: { success: true }, error: null });
  });

  it("returns error when source = destination", async () => {
    const result = await transferStock({
      fromWarehouseId: "wh-X",
      toWarehouseId: "wh-X",
      productId: "p1",
      quantity: 5,
    });
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/different/i);
  });

  it("returns error when insufficient stock", async () => {
    prismaMock.warehouse.findUnique
      .mockResolvedValueOnce({ id: "wh-A", code: "A", name: "A", isActive: true })
      .mockResolvedValueOnce({ id: "wh-B", code: "B", name: "B", isActive: true });

    prismaMock.$transaction.mockImplementation(async (fn: unknown) => {
      const tx = {
        inventoryItem: {
          findUnique: vi.fn().mockResolvedValue({
            id: "inv-1",
            quantity: 2,
            lowStockThreshold: 10,
          }),
          update: vi.fn(),
          upsert: vi.fn(),
        },
        inventoryTransaction: { createMany: vi.fn() },
      };
      if (typeof fn === "function") {
        return (fn as (t: typeof tx) => Promise<unknown>)(tx);
      }
      return undefined;
    });

    const result = await transferStock({
      fromWarehouseId: "wh-A",
      toWarehouseId: "wh-B",
      productId: "p1",
      quantity: 10,
    });

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/insufficient/i);
  });
});
