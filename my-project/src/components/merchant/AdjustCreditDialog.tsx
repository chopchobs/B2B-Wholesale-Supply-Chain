"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreditCard, Loader2 } from "lucide-react";

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
import {
  updateCreditLimit,
  type CustomerListItem,
  type CustomerDetail,
} from "@/server/actions/customers";

const formSchema = z.object({
  creditLimit: z.coerce
    .number({ message: "Must be a number." })
    .min(0, { message: "Credit limit must be 0 or greater." }),
});

type FormValues = z.infer<typeof formSchema>;

interface AdjustCreditDialogProps {
  customer: CustomerListItem | CustomerDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTHB(n: number): string {
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function AdjustCreditDialog(
  props: AdjustCreditDialogProps
): React.ReactElement {
  const { customer, open, onOpenChange } = props;
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: { creditLimit: 0 },
  });

  useEffect(() => {
    if (customer && open) {
      form.reset({ creditLimit: customer.creditLimit });
      setServerError(null);
    }
  }, [customer, open, form]);

  const watched = form.watch("creditLimit");
  const newLimit = Number(watched) || 0;
  const used = customer?.creditUsed ?? 0;
  const newAvailable = Math.max(0, newLimit - used);
  const belowUsed = newLimit < used;

  async function onSubmit(values: FormValues) {
    if (!customer) return;
    setServerError(null);
    const res = await updateCreditLimit(customer.id, values.creditLimit);
    if (res.error) {
      setServerError(res.error);
      return;
    }
    onOpenChange(false);
    startTransition(() => router.refresh());
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <CreditCard className="h-5 w-5 text-[#CC785C]" />
            Adjust Credit Limit
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            ปรับวงเงิน credit สำหรับ{" "}
            <span className="font-semibold text-[#2D2825]">
              {customer?.companyName ?? "-"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-[#E8E0D5] bg-[#F5F0E8] p-3 text-sm space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[#736B66]">Current Limit</span>
            <span className="font-semibold text-[#2D2825]">
              {formatTHB(customer?.creditLimit ?? 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#736B66]">Credit Used</span>
            <span className="font-semibold text-[#CC785C]">
              {formatTHB(used)}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#E8E0D5] pt-1.5">
            <span className="text-[#736B66]">New Available</span>
            <span className="font-semibold text-[#2D2825]">
              {formatTHB(newAvailable)}
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
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">
                    New Credit Limit (THB)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...field}
                      value={field.value as number}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {belowUsed && (
              <div className="text-xs font-medium text-destructive p-2 bg-destructive/10 rounded-md">
                ⚠ ตั้งวงเงินต่ำกว่ายอด credit ที่ใช้แล้ว ({formatTHB(used)}){" "}
                — ลูกค้าจะไม่สามารถใช้ credit ใหม่ได้
              </div>
            )}

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
                    Updating...
                  </>
                ) : (
                  "Update Limit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
