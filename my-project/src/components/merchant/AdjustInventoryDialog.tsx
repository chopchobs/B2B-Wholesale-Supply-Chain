"use client";

import React, { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Sliders } from "lucide-react";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {
  adjustInventory,
  type InventoryItemWithProduct,
} from "@/server/actions/inventory";

const formSchema = z.object({
  quantity: z.coerce
    .number()
    .int({ message: "Quantity must be an integer." })
    .refine((v) => v !== 0, { message: "Quantity must not be zero." }),
  note: z.string().min(1, { message: "Note is required for adjustments." }),
});

type FormValues = z.infer<typeof formSchema>;

interface AdjustInventoryDialogProps {
  item: InventoryItemWithProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdjustInventoryDialog(props: AdjustInventoryDialogProps) {
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
    const result = await adjustInventory({
      id: item.id,
      quantity: values.quantity,
      note: values.note,
    });
    if (result.error) {
      setServerError(result.error);
      return;
    }
    form.reset({ quantity: 0, note: "" });
    onOpenChange(false);
  }

  const isSubmitting = form.formState.isSubmitting;
  const previewQty = item.quantity + (Number(form.watch("quantity")) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <Sliders className="h-5 w-5 text-[#D4A574]" />
            Adjust Inventory
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            ปรับสต็อกของ{" "}
            <span className="font-semibold text-[#2D2825]">
              {item.productName}
            </span>{" "}
            (ใช้ค่าบวกเพื่อเพิ่ม, ค่าลบเพื่อลด)
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-[#F5F0E8] border border-[#E8E0D5] p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-[#736B66]">Current Stock</span>
            <span className="font-semibold text-[#2D2825]">
              {item.quantity.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#736B66]">After Adjustment</span>
            <span
              className={
                previewQty < 0
                  ? "font-semibold text-destructive"
                  : "font-semibold text-[#CC785C]"
              }
            >
              {previewQty.toLocaleString()}
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
                    Adjustment Quantity
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. -5 or 10"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[#736B66]">
                    ใส่ค่าลบเพื่อลด (เช่น ของชำรุด) หรือบวกเพื่อเพิ่ม (เช่น พบของในคลัง)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Damaged in warehouse during transfer"
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
                disabled={isSubmitting || previewQty < 0}
                className="bg-[#CC785C] text-white hover:bg-[#B86548]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Confirm Adjustment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
