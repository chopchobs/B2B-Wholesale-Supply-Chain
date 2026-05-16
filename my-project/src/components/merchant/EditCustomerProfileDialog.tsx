"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Pencil } from "lucide-react";

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
  updateCustomerProfile,
  type CustomerListItem,
  type CustomerDetail,
} from "@/server/actions/customers";

const formSchema = z.object({
  companyName: z.string().min(1, { message: "Company name is required." }),
  taxId: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditCustomerProfileDialogProps {
  customer: CustomerListItem | CustomerDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCustomerProfileDialog(
  props: EditCustomerProfileDialogProps
): React.ReactElement {
  const { customer, open, onOpenChange } = props;
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      companyName: "",
      taxId: "",
      billingAddress: "",
      shippingAddress: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (customer && open) {
      // pre-fill form with current values (detail vs list shape มี billing/shipping เฉพาะ detail)
      const detail = customer as CustomerDetail;
      form.reset({
        companyName: customer.companyName,
        taxId: customer.taxId ?? "",
        billingAddress: detail.billingAddress ?? "",
        shippingAddress: detail.shippingAddress ?? "",
        notes: detail.notes ?? "",
      });
    }
  }, [customer, open, form]);

  async function onSubmit(values: FormValues) {
    if (!customer) return;
    setServerError(null);
    const res = await updateCustomerProfile(customer.id, {
      companyName: values.companyName,
      taxId: values.taxId || null,
      billingAddress: values.billingAddress || null,
      shippingAddress: values.shippingAddress || null,
      notes: values.notes || null,
    });
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
      <DialogContent className="sm:max-w-lg bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <Pencil className="h-5 w-5 text-[#CC785C]" />
            Edit Customer Profile
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            อัปเดตข้อมูลของ{" "}
            <span className="font-semibold text-[#2D2825]">
              {customer?.companyName ?? "-"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">
                    Company Name
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Tax ID</FormLabel>
                  <FormControl>
                    <Input placeholder="0-0000-00000-00-0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">
                    Billing Address
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shippingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">
                    Shipping Address
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
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
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
