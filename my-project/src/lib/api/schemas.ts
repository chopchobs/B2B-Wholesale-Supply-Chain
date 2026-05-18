import { z } from "zod";

// --- Product schemas ---

export const CreateProductSchema = z.object({
  name: z.string().min(1, "name is required").max(255),
  sku: z.string().min(1, "sku is required").max(64),
  description: z.string().optional(),
  basePrice: z.number().nonnegative("basePrice must be >= 0"),
  moq: z.number().int().positive().optional(),
  shopId: z.string().min(1, "shopId is required"),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// --- Order schemas ---

export const CreateOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const CreateOrderSchema = z.object({
  items: z.array(CreateOrderItemSchema).min(1, "at least 1 item required"),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderSchema = z.object({
  // PUT /orders/[id] — merchant แก้ได้แค่ field meta
  notes: z.string().optional(),
});
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;

export const OrderStatusEnum = z.enum([
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);
export type OrderStatusValue = z.infer<typeof OrderStatusEnum>;

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

// --- Inventory schemas ---

export const UpdateInventorySchema = z.object({
  quantity: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  note: z.string().optional(),
});
export type UpdateInventoryInput = z.infer<typeof UpdateInventorySchema>;

// --- Customer schemas ---

export const CustomerTierEnum = z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]);
export const CustomerStatusEnum = z.enum(["ACTIVE", "SUSPENDED", "PENDING"]);

export const CreateCustomerSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  companyName: z.string().min(1).max(255),
  taxId: z.string().optional().nullable(),
  creditLimit: z.number().nonnegative().optional(),
  accountTier: CustomerTierEnum.optional(),
  status: CustomerStatusEnum.optional(),
  billingAddress: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export const UpdateCustomerSchema = CreateCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
