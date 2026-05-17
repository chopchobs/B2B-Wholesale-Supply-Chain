"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// ----- Types & Schemas -----

export type BusinessType = "WHOLESALE" | "RETAIL" | "BOTH";

export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

const shopSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters."),
  description: z.string().max(500).optional().nullable(),
  businessType: z.enum(["WHOLESALE", "RETAIL", "BOTH"]),
});

export type CreateShopInput = z.infer<typeof shopSchema>;

const firstProductSchema = z.object({
  shopId: z.string().min(1, "shopId is required"),
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(2, "SKU must be at least 2 characters."),
  basePrice: z.number().min(0, "Price cannot be negative"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
});

export type CreateFirstProductInput = z.infer<typeof firstProductSchema>;

export interface CreatedShop {
  id: string;
  name: string;
}

export interface CreatedProduct {
  id: string;
  sku: string;
  name: string;
}

// ----- Helpers -----

// ดึง user ปัจจุบันจาก supabase session (return null ถ้าไม่มี)
async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ----- Actions -----

// สร้างหรืออัปเดต Shop ของ user ปัจจุบัน
// description เก็บรวม businessType ในรูปแบบ prefix "[BUSINESS_TYPE] description"
// (เนื่องจาก schema ปัจจุบันยังไม่มี field businessType โดยตรง)
export async function createShop(
  input: CreateShopInput,
): Promise<ActionResult<CreatedShop>> {
  try {
    const parsed = shopSchema.parse(input);
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: "You must be signed in to create a shop." };
    }

    // ตรวจว่ามี shop ของ user อยู่แล้วหรือไม่ — ถ้ามีให้ update ตัวล่าสุด
    const existing = await prisma.shop.findFirst({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
    });

    const composedDescription = parsed.description
      ? `[${parsed.businessType}] ${parsed.description}`
      : `[${parsed.businessType}]`;

    const shop = existing
      ? await prisma.shop.update({
          where: { id: existing.id },
          data: {
            name: parsed.name,
            description: composedDescription,
          },
          select: { id: true, name: true },
        })
      : await prisma.shop.create({
          data: {
            name: parsed.name,
            description: composedDescription,
            ownerId: userId,
          },
          select: { id: true, name: true },
        });

    revalidatePath("/merchant");
    return { data: shop, error: null };
  } catch (err: unknown) {
    console.error("createShop failed:", err);
    if (err instanceof z.ZodError) {
      return { data: null, error: err.issues[0]?.message ?? "Invalid input" };
    }
    const message = err instanceof Error ? err.message : "Failed to create shop.";
    return { data: null, error: message };
  }
}

// สร้าง Product แรกของร้าน (ใช้ในขั้นตอน onboarding)
export async function createFirstProduct(
  input: CreateFirstProductInput,
): Promise<ActionResult<CreatedProduct>> {
  try {
    const parsed = firstProductSchema.parse(input);
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: "You must be signed in to add a product." };
    }

    // กันการสร้างสินค้าให้ shop ที่ไม่ใช่ของ user คนนี้
    const shop = await prisma.shop.findFirst({
      where: { id: parsed.shopId, ownerId: userId },
      select: { id: true },
    });
    if (!shop) {
      return { data: null, error: "Shop not found or not owned by you." };
    }

    const product = await prisma.product.create({
      data: {
        sku: parsed.sku,
        name: parsed.name,
        basePrice: parsed.basePrice,
        stock: parsed.stock,
        moq: 1,
        isActive: true,
        shopId: shop.id,
      },
      select: { id: true, sku: true, name: true },
    });

    revalidatePath("/merchant/products");
    return { data: product, error: null };
  } catch (err: unknown) {
    console.error("createFirstProduct failed:", err);
    if (err instanceof z.ZodError) {
      return { data: null, error: err.issues[0]?.message ?? "Invalid input" };
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { data: null, error: "A product with this SKU already exists." };
    }
    const message = err instanceof Error ? err.message : "Failed to create product.";
    return { data: null, error: message };
  }
}
