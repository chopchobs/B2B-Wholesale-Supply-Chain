"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Truck } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { createInboundShipment } from "@/server/actions/purchaseOrders";

const formSchema = z.object({
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  shippedAt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddShipmentDialogProps {
  purchaseOrderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddShipmentDialog(
  props: AddShipmentDialogProps
): React.ReactElement {
  const { purchaseOrderId, open, onOpenChange } = props;
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      trackingNumber: "",
      carrier: "",
      shippedAt: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await createInboundShipment(purchaseOrderId, {
      trackingNumber: values.trackingNumber || null,
      carrier: values.carrier || null,
      shippedAt: values.shippedAt ? new Date(values.shippedAt) : null,
    });
    if (res.error) {
      setServerError(res.error);
      return;
    }
    form.reset();
    onOpenChange(false);
    startTransition(() => router.refresh());
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <Truck className="h-5 w-5 text-[#CC785C]" />
            Add Inbound Shipment
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            บันทึก tracking สำหรับการขนส่งของ PO นี้
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="trackingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">
                    Tracking Number
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. TH123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Carrier</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Kerry, Flash, DHL"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shippedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Shipped At</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
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
                    Adding...
                  </>
                ) : (
                  "Add Shipment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
