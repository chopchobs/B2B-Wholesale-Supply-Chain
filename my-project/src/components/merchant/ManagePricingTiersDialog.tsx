"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Loader2, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { savePricingTiers } from "@/server/actions/pricingTiers";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const tierSchema = z.object({
  minQuantity: z.coerce.number().min(1, { message: "Minimum quantity must be at least 1." }),
  unitPrice: z.coerce.number().min(0, { message: "Price must be a positive number." }),
});

const formSchema = z.object({
  tiers: z.array(tierSchema),
});

interface ManagePricingTiersDialogProps {
  product: {
    id: string;
    name: string;
    basePrice: number | any; // Prisma Decimal handled safely
  };
  // We can pass existing tiers if we fetch them, but for now we start fresh or empty if none provided
  existingTiers?: { minQuantity: number; unitPrice: number | any }[];
}

export function ManagePricingTiersDialog({ product, existingTiers = [] }: ManagePricingTiersDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      tiers: existingTiers.length > 0 
        ? existingTiers.map(t => ({ minQuantity: t.minQuantity, unitPrice: Number(t.unitPrice) }))
        : [{ minQuantity: 50, unitPrice: Number(product.basePrice) * 0.9 }], // Default suggestion
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tiers",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setServerError(null);
    try {
      const response = await savePricingTiers(product.id, values.tiers);
      
      if (!response.success) {
        setServerError(response.message || "Failed to save pricing tiers.");
        return;
      }
      
      setIsOpen(false);
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {/* We use DropdownMenuItem as child but prevent its default close behavior to open the dialog */}
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
          <Tags className="mr-2 h-4 w-4" />
          Manage Tiered Pricing
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Tiered Pricing</DialogTitle>
          <DialogDescription>
            Set volume discounts for <strong>{product.name}</strong>. The base price is ฿{Number(product.basePrice).toLocaleString()}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-4 bg-muted/20 p-4 rounded-lg border border-border/50">
                  <FormField
                    control={form.control}
                    name={`tiers.${index}.minQuantity`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Minimum Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`tiers.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Unit Price (฿)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mb-0.5 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {fields.length === 0 && (
              <div className="text-center p-8 bg-muted/10 rounded-lg border border-dashed border-border/50 text-muted-foreground">
                No pricing tiers defined. Add one below.
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 text-primary border-primary/20 hover:bg-primary/5"
              onClick={() => append({ minQuantity: 100, unitPrice: Number(product.basePrice) * 0.8 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Pricing Tier
            </Button>

            {serverError && (
              <div className="text-sm font-medium text-destructive mt-2 p-3 bg-destructive/10 rounded-md">
                {serverError}
              </div>
            )}

            <div className="pt-4 flex justify-end gap-2 border-t mt-6">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Tiers"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
