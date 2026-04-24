"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createProduct } from "@/server/actions/product";

// Form Validation Schema
const formSchema = z.object({
  sku: z.string().min(3, { message: "SKU must be at least 3 characters." }),
  name: z.string().min(1, { message: "Product name is required." }),
  basePrice: z.coerce
    .number()
    .min(0, { message: "Price must be a positive number." }),
  moq: z.coerce.number().min(1, { message: "MOQ must be at least 1." }),
  stock: z.coerce.number().min(0, { message: "Stock cannot be negative." }),
});

export function AddProductForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      sku: "",
      name: "",
      basePrice: 0,
      moq: 1,
      stock: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setServerError(null);
    try {
      const response = await createProduct(values);

      if (!response.success) {
        setServerError(response.message);
        return;
      }

      // Reset form and close sheet on success
      form.reset();
      setIsOpen(false);
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add New Product
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Add New Product</SheetTitle>
          <SheetDescription>
            Enter the details for the new product. Click save when you're done.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 mt-6 overflow-hidden">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col h-full"
            >
              <div className="flex-1 overflow-y-auto space-y-4 pr-6 -mr-6 px-1 pb-6">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. W-COFFEE-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Premium Arabica Coffee Beans"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price (฿)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="moq"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MOQ</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Current available quantity.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {serverError && (
                  <div className="text-sm font-medium text-destructive mt-2 p-3 bg-destructive/10 rounded-md">
                    {serverError}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t mt-auto shrink-0 pb-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-base font-semibold shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Product"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
