"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Building2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";

import { createWarehouse } from "@/server/actions/warehouse";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required.")
    .max(100, "Name is too long."),
  location: z.string().max(500).optional(),
  capacity: z.coerce
    .number()
    .int({ message: "Capacity must be an integer." })
    .nonnegative({ message: "Capacity must be ≥ 0." })
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateWarehouseDialog(): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      location: "",
      capacity: undefined,
    },
  });

  async function onSubmit(values: FormValues): Promise<void> {
    setServerError(null);
    const result = await createWarehouse({
      name: values.name,
      location: values.location?.trim() ? values.location.trim() : null,
      capacity: values.capacity ?? null,
    });
    if (result.error) {
      setServerError(result.error);
      return;
    }
    form.reset({ name: "", location: "", capacity: undefined });
    setOpen(false);
    router.refresh();
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#CC785C] text-white hover:bg-[#B86548]">
          <Plus className="h-4 w-4 mr-1" />
          Add Warehouse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <Building2 className="h-5 w-5 text-[#CC785C]" />
            Add Warehouse
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            สร้างคลังสินค้าใหม่ พร้อมระบุที่อยู่และความจุ
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
                  <FormLabel className="text-[#2D2825]">Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Bangkok Central Warehouse"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">
                    Location / Address
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. 123 Sukhumvit Road, Bangkok"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">
                    Capacity (units)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 10000"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-[#736B66]">
                    Optional. ความจุสูงสุดสำหรับแสดง utilization bar.
                  </FormDescription>
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
                  "Create Warehouse"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
