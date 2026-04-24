import React from "react";
import { MoreHorizontal, Edit, Tags, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

import { AddProductForm } from "@/components/merchant/AddProductForm";
import { ManagePricingTiersDialog } from "@/components/merchant/ManagePricingTiersDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const dynamic = "force-dynamic";

export default async function MerchantProductsPage() {
  // Fetch real data from PostgreSQL via Prisma
  // We order by createdAt descending so newest products show first
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        priceTiers: true,
      },
    });
  } catch (error) {
    console.error("Database connection error:", error);
    // Fallback to empty array if DB fails
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Product Catalog
        </h2>
        <div className="flex items-center space-x-2">
          <AddProductForm />
        </div>
      </div>

      {/* Data Table Section */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[120px]">SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="text-right">Base Price</TableHead>
              <TableHead className="text-right">MOQ</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[80px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="hover:bg-muted/20">
                <TableCell className="font-medium text-muted-foreground">
                  {product.sku}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      {product.name}
                    </span>
                    {product.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {product.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ฿{Number(product.basePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right">
                  {product.moq.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {product.stock.toLocaleString()}
                </TableCell>
                <TableCell>
                  {product.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Product
                      </DropdownMenuItem>
                      <ManagePricingTiersDialog 
                        product={product} 
                        existingTiers={product.priceTiers} 
                      />
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Soft Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <span className="text-lg font-medium text-foreground">No products found</span>
                    <span className="text-sm">Click "Add New Product" to get started.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
