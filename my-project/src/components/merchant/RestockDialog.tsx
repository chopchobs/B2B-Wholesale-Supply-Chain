"use client";

import React, { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, PackagePlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {
  restockItem,
  type InventoryItemWithProduct,
} from "@/server/actions/inventory";

const formSchema = z.object({
  quantity: z.coerce
    .number()
    .int({ message: "Quantity must be an integer." })
    .positive({ message: "Quantity must be greater than 0." }),
  note: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RestockDialogProps {
  item: InventoryItemWithProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestockDialog(props: RestockDialogProps) {
  const { item, open, onOpenChange } = props;
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      quantity: 0,
      note: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await restockItem({
      id: item.id,
      quantity: values.quantity,
      note: values.note || null,
    });
    if (result.error) {
      setServerError(result.error);
      return;
    }
    form.reset({ quantity: 0, note: "" });
    onOpenChange(false);
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <PackagePlus className="h-5 w-5 text-[#CC785C]" />
            Restock Inventory
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            เพิ่มจำนวนสต็อกของ{" "}
            <span className="font-semibold text-[#2D2825]">
              {item.productName}
            </span>{" "}
            <span className="font-mono">({item.sku})</span>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-[#F5F0E8] border border-[#E8E0D5] p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#736B66]">Current Stock</span>
            <span className="font-semibold text-[#2D2825]">
              {item.quantity.toLocaleString()}
            </span>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">
                    Quantity to Add
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g. 50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">
                    Note (optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. PO #1234 from Supplier A"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError && (
              <div className="text-sm font-medium text-destructive p-3 bg-destructive/10 rounded-md">
                {serverError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#CC785C] text-white hover:bg-[#B86548]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Confirm Restock"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
