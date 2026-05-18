import { describe, it, expect } from "vitest";
import {
  CreateProductSchema,
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  UpdateInventorySchema,
} from "@/lib/api/schemas";

describe("CreateProductSchema", () => {
  it("accepts valid input", () => {
    const result = CreateProductSchema.safeParse({
      name: "Widget",
      sku: "WID-001",
      basePrice: 100,
      shopId: "shop-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = CreateProductSchema.safeParse({
      sku: "WID-001",
      basePrice: 100,
      shopId: "shop-1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative basePrice", () => {
    const result = CreateProductSchema.safeParse({
      name: "Widget",
      sku: "WID-001",
      basePrice: -10,
      shopId: "shop-1",
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateOrderSchema", () => {
  it("accepts valid items", () => {
    const result = CreateOrderSchema.safeParse({
      items: [{ productId: "p1", quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty items", () => {
    const result = CreateOrderSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive quantity", () => {
    const result = CreateOrderSchema.safeParse({
      items: [{ productId: "p1", quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateOrderStatusSchema", () => {
  it("accepts valid status", () => {
    const result = UpdateOrderStatusSchema.safeParse({ status: "PROCESSING" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = UpdateOrderStatusSchema.safeParse({ status: "FOO" });
    expect(result.success).toBe(false);
  });
});

describe("UpdateInventorySchema", () => {
  it("accepts partial valid input", () => {
    const result = UpdateInventorySchema.safeParse({ quantity: 10 });
    expect(result.success).toBe(true);
  });

  it("rejects negative quantity", () => {
    const result = UpdateInventorySchema.safeParse({ quantity: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative lowStockThreshold", () => {
    const result = UpdateInventorySchema.safeParse({ lowStockThreshold: -5 });
    expect(result.success).toBe(false);
  });
});
