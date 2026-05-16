"use client";

import React, { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CreditCard } from "lucide-react";
import { PaymentMethod } from "@prisma/client";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  InvoiceListItem,
  RecordPaymentInput,
} from "@/server/actions/invoices";

const formSchema = z.object({
  amount: z.coerce
    .number({ message: "Amount must be a number." })
    .positive({ message: "Amount must be greater than 0." }),
  method: z.enum(["BANK_TRANSFER", "CREDIT", "CASH"]),
  reference: z.string().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RecordPaymentDialogProps {
  invoice: InvoiceListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RecordPaymentInput) => Promise<{ ok: boolean; error?: string }>;
  onRecorded?: () => void;
}

export function RecordPaymentDialog(
  props: RecordPaymentDialogProps
): React.ReactElement {
  const { invoice, open, onOpenChange, onSubmit, onRecorded } = props;
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      amount: 0,
      method: "BANK_TRANSFER",
      reference: "",
      note: "",
    },
  });

  // เมื่อเปิด dialog ให้ pre-fill amount ด้วยยอด total ของ invoice
  // ใช้ ref กันการเรียก reset ซ้ำในรอบเดียวกัน
  const lastResetKey = React.useRef<string | null>(null);
  useEffect(() => {
    if (invoice && open) {
      const key = `${invoice.id}-${invoice.total}`;
      if (lastResetKey.current !== key) {
        lastResetKey.current = key;
        form.reset({
          amount: invoice.total,
          method: "BANK_TRANSFER",
          reference: "",
          note: "",
        });
      }
    } else if (!open) {
      lastResetKey.current = null;
    }
  }, [invoice, open, form]);

  async function handleSubmit(values: FormValues) {
    setServerError(null);
    const res = await onSubmit({
      amount: values.amount,
      method: values.method as PaymentMethod,
      reference: values.reference || null,
      note: values.note || null,
    });
    if (!res.ok) {
      setServerError(res.error ?? "Failed to record payment.");
      return;
    }
    onRecorded?.();
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <CreditCard className="h-5 w-5 text-[#CC785C]" />
            Record Payment
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            บันทึกการชำระเงินสำหรับใบแจ้งหนี้{" "}
            <span className="font-mono font-semibold text-[#2D2825]">
              {invoice?.invoiceNumber ?? "-"}
            </span>
          </DialogDescription>
        </DialogHeader>

        {invoice && (
          <div className="rounded-lg bg-[#F5F0E8] border border-[#E8E0D5] p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-[#736B66]">Customer</span>
              <span className="font-semibold text-[#2D2825]">
                {invoice.order.user.name || invoice.order.user.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#736B66]">Invoice Total</span>
              <span className="font-semibold text-[#CC785C]">
                ฿
                {invoice.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Amount (THB)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">
                    Payment Method
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white border-[#E8E0D5]">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="BANK_TRANSFER">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="CREDIT">Credit</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">
                    Reference (optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. TXN-2026-0001 / slip ref"
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
                    <Textarea rows={2} placeholder="Internal note" {...field} />
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
                    Recording...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
