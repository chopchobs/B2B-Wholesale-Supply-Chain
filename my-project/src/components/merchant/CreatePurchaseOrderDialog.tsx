"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2, ClipboardList } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPurchaseOrder } from "@/server/actions/purchaseOrders";

export interface SupplierOption {
  id: string;
  name: string;
}

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
}

const itemSchema = z.object({
  productId: z.string().min(1, { message: "Product is required." }),
  quantity: z.coerce
    .number({ message: "Quantity must be a number." })
    .int({ message: "Quantity must be an integer." })
    .positive({ message: "Quantity must be greater than 0." }),
  unitCost: z.coerce
    .number({ message: "Unit cost must be a number." })
    .min(0, { message: "Unit cost must be 0 or greater." }),
});

const formSchema = z.object({
  supplierId: z.string().min(1, { message: "Supplier is required." }),
  expectedDelivery: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, { message: "At least one item required." }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePurchaseOrderDialogProps {
  suppliers: SupplierOption[];
  products: ProductOption[];
}

function formatTHB(n: number): string {
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function CreatePurchaseOrderDialog(
  props: CreatePurchaseOrderDialogProps
): React.ReactElement {
  const { suppliers, products } = props;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      supplierId: "",
      expectedDelivery: "",
      notes: "",
      items: [{ productId: "", quantity: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const subtotal = useMemo(() => {
    return watchItems.reduce((sum, it) => {
      const q = Number(it.quantity) || 0;
      const c = Number(it.unitCost) || 0;
      return sum + q * c;
    }, 0);
  }, [watchItems]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await createPurchaseOrder({
      supplierId: values.supplierId,
      expectedDelivery: values.expectedDelivery
        ? new Date(values.expectedDelivery)
        : null,
      notes: values.notes || null,
      items: values.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitCost: it.unitCost,
      })),
    });
    if (res.error) {
      setServerError(res.error);
      return;
    }
    form.reset({
      supplierId: "",
      expectedDelivery: "",
      notes: "",
      items: [{ productId: "", quantity: 1, unitCost: 0 }],
    });
    setOpen(false);
    startTransition(() => router.refresh());
  }

  const isSubmitting = form.formState.isSubmitting;
  const noProducts = products.length === 0;
  const noSuppliers = suppliers.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-[#CC785C] text-white hover:bg-[#B86548]"
          disabled={noProducts || noSuppliers}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create PO
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-[#E8E0D5]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2D2825]">
            <ClipboardList className="h-5 w-5 text-[#CC785C]" />
            Create Purchase Order
          </DialogTitle>
          <DialogDescription className="text-[#736B66]">
            สร้างใบสั่งซื้อใหม่ — เลือก supplier และเพิ่มรายการสินค้า
          </DialogDescription>
        </DialogHeader>

        {(noProducts || noSuppliers) && (
          <div className="text-sm font-medium text-amber-700 p-3 bg-amber-50 rounded-md border border-amber-200">
            {noSuppliers && "ยังไม่มี supplier ในระบบ "}
            {noProducts && "ยังไม่มี product ในระบบ "}
            กรุณาเพิ่มก่อนสร้าง PO
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2D2825]">Supplier</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white border-[#E8E0D5]">
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedDelivery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2D2825]">
                      Expected Delivery
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-[#2D2825]">
                  Line Items
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ productId: "", quantity: 1, unitCost: 0 })
                  }
                  className="border-[#E8E0D5] text-[#CC785C] hover:bg-[#F5F0E8]"
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((f, idx) => (
                  <div
                    key={f.id}
                    className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg border border-[#E8E0D5] bg-[#F5F0E8]/40"
                  >
                    <div className="col-span-6">
                      <FormField
                        control={form.control}
                        name={`items.${idx}.productId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-[#736B66]">
                              Product
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(v) => {
                                field.onChange(v);
                                // pre-fill unitCost จาก basePrice ถ้ายังเป็น 0
                                const product = products.find(
                                  (p) => p.id === v
                                );
                                const currentCost = Number(
                                  form.getValues(`items.${idx}.unitCost`)
                                );
                                if (product && currentCost === 0) {
                                  form.setValue(
                                    `items.${idx}.unitCost`,
                                    product.basePrice
                                  );
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-white border-[#E8E0D5]">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white">
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.sku} — {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${idx}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-[#736B66]">
                              Qty
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                className="bg-white"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`items.${idx}.unitCost`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-[#736B66]">
                              Unit Cost (฿)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="bg-white"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fields.length > 1 && remove(idx)}
                        disabled={fields.length === 1}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-3">
                <div className="text-sm">
                  <span className="text-[#736B66] mr-2">Subtotal:</span>
                  <span className="font-bold text-[#CC785C] text-base">
                    {formatTHB(subtotal)}
                  </span>
                </div>
              </div>
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
                    Creating...
                  </>
                ) : (
                  "Create PO"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
