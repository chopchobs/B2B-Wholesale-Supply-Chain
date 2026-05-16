"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Warehouse } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { createWarehouse } from "@/server/actions/settings";

const formSchema = z.object({
  name: z.string().min(1, { message: "Warehouse name is required." }),
  code: z
    .string()
    .min(1, { message: "Code is required." })
    .max(20, { message: "Code is too long." })
    .regex(/^[A-Za-z0-9_-]+$/, {
      message: "Code must contain only letters, numbers, _ or -.",
    }),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  isDefault: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddWarehouseDialog(): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      code: "",
      address: "",
      city: "",
      country: "",
      notes: "",
      isDefault: false,
    },
  });

  async function onSubmit(values: FormValues): Promise<void> {
    setServerError(null);
    const res = await createWarehouse({
      name: values.name,
      code: values.code,
      address: values.address || null,
      city: values.city || null,
      country: values.country || null,
      notes: values.notes || null,
      isDefault: values.isDefault,
    });
    if (res.error) {
      setServerError(res.error);
      return;
    }
    form.reset();
    setOpen(false);
    startTransition(() => router.refresh());
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#CC785C] text-white hover:bg-[#B86548]">
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <Warehouse className="h-5 w-5 text-[#CC785C]" />
            Add New Warehouse
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            กรอกข้อมูลคลังสินค้าใหม่
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2D2825]">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Warehouse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2D2825]">Code</FormLabel>
                    <FormControl>
                      <Input placeholder="MAIN-WH" {...field} />
                    </FormControl>
                    <FormDescription className="text-[#736B66] text-xs">
                      ตัวอักษร/ตัวเลข/_/- เท่านั้น
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Address</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="123 Warehouse Rd."
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
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2D2825]">City</FormLabel>
                    <FormControl>
                      <Input placeholder="Bangkok" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2D2825]">Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Thailand" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Internal note (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border border-[#E8E0D5] p-3">
                  <div className="space-y-0.5 pr-4">
                    <FormLabel className="text-[#2D2825]">
                      Set as default warehouse
                    </FormLabel>
                    <FormDescription className="text-[#736B66] text-xs">
                      ใช้คลังนี้เป็นค่าเริ่มต้นในการสั่งซื้อ/รับสินค้า
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-[#CC785C]"
                    />
                  </FormControl>
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
                onClick={() => setOpen(false)}
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
                  "Save Warehouse"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
