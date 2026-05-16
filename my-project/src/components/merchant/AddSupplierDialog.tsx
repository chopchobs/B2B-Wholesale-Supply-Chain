"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Truck } from "lucide-react";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createSupplier } from "@/server/actions/suppliers";

const formSchema = z.object({
  name: z.string().min(1, { message: "Supplier name is required." }),
  email: z
    .string()
    .email({ message: "Invalid email." })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddSupplierDialog(): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      contactPerson: "",
      website: "",
      notes: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await createSupplier({
      name: values.name,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      contactPerson: values.contactPerson || null,
      website: values.website || null,
      notes: values.notes || null,
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
          Add Supplier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <Truck className="h-5 w-5 text-[#CC785C]" />
            Add New Supplier
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            กรอกข้อมูล supplier ใหม่เพื่อเริ่มใช้งานในระบบ Purchase Order
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Supplier Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ACME Wholesale Co." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2D2825]">
                      Contact Person
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="คุณสมชาย" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2D2825]">Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="02-XXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="sales@supplier.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://supplier.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Address</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Office address"
                      {...field}
                    />
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
                  "Save Supplier"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
