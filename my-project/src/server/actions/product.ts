"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod schema for server-side validation
const productSchema = z.object({
  sku: z.string().min(3, "SKU must be at least 3 characters long"),
  name: z.string().min(1, "Product name is required"),
  basePrice: z.number().min(0, "Base price cannot be negative"),
  moq: z.number().min(1, "MOQ must be at least 1"),
  stock: z.number().min(0, "Stock cannot be negative"),
});

export type CreateProductData = z.infer<typeof productSchema>;

export async function createProduct(data: CreateProductData) {
  try {
    // 1. Validate data
    const parsedData = productSchema.parse(data);

    // 2. Insert into database
    // MOCK: We use a dummy shopId since auth is not set up yet.
    // In a real scenario, this would come from the session context.
    const DUMMY_SHOP_ID = "dummy_shop_id_123"; 

    const newProduct = await prisma.product.create({
      data: {
        sku: parsedData.sku,
        name: parsedData.name,
        basePrice: parsedData.basePrice,
        moq: parsedData.moq,
        stock: parsedData.stock,
        isActive: true, // Default to active when created
        shopId: DUMMY_SHOP_ID, 
        // categoryId is optional so we can leave it null for now
      },
    });

    // 3. Revalidate the product listing page to reflect the new data
    revalidatePath("/merchant/products");

    return { success: true, product: newProduct };
  } catch (error: any) {
    console.error("Failed to create product:", error);
    
    // Check for Prisma unique constraint violation (e.g. SKU already exists)
    if (error.code === "P2002") {
      return { success: false, message: "A product with this SKU already exists." };
    }
    
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}
