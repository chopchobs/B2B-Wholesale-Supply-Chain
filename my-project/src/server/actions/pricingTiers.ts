"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod schema for server-side validation
const tierSchema = z.object({
  minQuantity: z.number().min(1, "Minimum quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
});

const pricingTiersSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  tiers: z.array(tierSchema),
});

export type SavePricingTiersData = z.infer<typeof pricingTiersSchema>;

export async function savePricingTiers(productId: string, tiers: { minQuantity: number; unitPrice: number }[]) {
  try {
    // 1. Validate data
    const parsedData = pricingTiersSchema.parse({ productId, tiers });

    // 2. Use a transaction to delete existing tiers and create new ones
    await prisma.$transaction(async (tx) => {
      // Delete existing price tiers for this product to ensure a clean state
      await tx.priceTier.deleteMany({
        where: { productId: parsedData.productId },
      });

      // Bulk create new price tiers if the array is not empty
      if (parsedData.tiers.length > 0) {
        await tx.priceTier.createMany({
          data: parsedData.tiers.map((tier) => ({
            productId: parsedData.productId,
            minQuantity: tier.minQuantity,
            unitPrice: tier.unitPrice,
            // targetRole and isActive will use their schema defaults (VIP_CLIENT, true)
          })),
        });
      }
    });

    // 3. Revalidate the product listing page to reflect the new data
    revalidatePath("/merchant/products");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save pricing tiers:", error);
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}
