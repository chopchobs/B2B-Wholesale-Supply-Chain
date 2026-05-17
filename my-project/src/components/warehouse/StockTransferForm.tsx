"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Package,
  Warehouse as WarehouseIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

import {
  listTransferableProducts,
  transferStock,
  type TransferProductOption,
  type WarehouseOption,
} from "@/server/actions/warehouse";

interface StockTransferFormProps {
  warehouses: WarehouseOption[];
  initialFromId?: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

export function StockTransferForm(
  props: StockTransferFormProps
): React.ReactElement {
  const { warehouses, initialFromId } = props;
  const router = useRouter();

  // ถ้ามี initialFromId ให้เริ่มที่ step 2 เลย
  const [step, setStep] = useState<Step>(initialFromId ? 2 : 1);
  const [fromId, setFromId] = useState<string>(initialFromId ?? "");
  const [toId, setToId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);

  const [products, setProducts] = useState<TransferProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // โหลด product เมื่อ fromId เปลี่ยน (sync กับ external system → server action)
  useEffect(() => {
    if (!fromId) {
      return;
    }
    let cancelled = false;
    async function load(): Promise<void> {
      setLoadingProducts(true);
      const result = await listTransferableProducts(fromId);
      if (cancelled) return;
      setLoadingProducts(false);
      if (result.error) {
        setErrorMsg(result.error);
        setProducts([]);
        return;
      }
      setProducts(result.data ?? []);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [fromId]);

  const fromWarehouse = useMemo(
    () => warehouses.find((w) => w.id === fromId),
    [warehouses, fromId]
  );
  const toWarehouse = useMemo(
    () => warehouses.find((w) => w.id === toId),
    [warehouses, toId]
  );
  const selectedProduct = useMemo(
    () => products.find((p) => p.productId === productId),
    [products, productId]
  );

  // dropdown ปลายทาง: ตัด source ออก + เฉพาะ active
  const destinationOptions = useMemo(
    () => warehouses.filter((w) => w.id !== fromId),
    [warehouses, fromId]
  );

  function handleNext(): void {
    setErrorMsg(null);
    if (step === 1) {
      if (!fromId) {
        setErrorMsg("Please select a source warehouse.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!productId) {
        setErrorMsg("Please select a product to transfer.");
        return;
      }
      // pre-fill quantity ด้วยยอดเต็ม (ผู้ใช้สามารถปรับลดเพื่อ partial transfer ได้)
      if (selectedProduct) {
        setQuantity(selectedProduct.quantity);
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!toId) {
        setErrorMsg("Please select a destination warehouse.");
        return;
      }
      if (!selectedProduct) {
        setErrorMsg("Selected product is no longer available.");
        return;
      }
      if (quantity <= 0) {
        setErrorMsg("Quantity must be greater than 0.");
        return;
      }
      if (quantity > selectedProduct.quantity) {
        setErrorMsg(
          `Quantity exceeds available stock (${selectedProduct.quantity}).`
        );
        return;
      }
      setStep(4);
      return;
    }
  }

  function handleBack(): void {
    setErrorMsg(null);
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  }

  async function handleSubmit(): Promise<void> {
    setErrorMsg(null);
    setSubmitting(true);
    const result = await transferStock({
      fromWarehouseId: fromId,
      toWarehouseId: toId,
      productId,
      quantity,
    });
    setSubmitting(false);
    if (result.error) {
      setErrorMsg(result.error);
      return;
    }
    setStep(5);
    router.refresh();
  }

  function resetForm(): void {
    setStep(1);
    setFromId(initialFromId ?? "");
    setToId("");
    setProductId("");
    setQuantity(0);
    setProducts([]);
    setErrorMsg(null);
  }

  // --- Step 5: success ---
  if (step === 5) {
    return (
      <Card className="bg-white border-[#E8E0D5]">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-[#CC785C]/10 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-[#CC785C]" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#2D2825]">
              Transfer Complete
            </h2>
            <p className="text-[#736B66] mt-1">
              ย้ายสต็อกสินค้าเรียบร้อยแล้ว
            </p>
          </div>
          <div className="rounded-lg bg-[#F5F0E8] border border-[#E8E0D5] p-4 text-left text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#736B66]">{fromWarehouse?.name}</span>
              <ArrowRight className="h-4 w-4 text-[#CC785C]" />
              <span className="text-[#736B66]">{toWarehouse?.name}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E8E0D5]">
              <span className="font-semibold text-[#2D2825]">
                {selectedProduct?.productName}
              </span>
              <span className="text-[#736B66]"> × {quantity.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <Button
              variant="outline"
              onClick={resetForm}
              className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
            >
              Transfer Another
            </Button>
            <Link href={`/merchant/warehouse/${toId}`}>
              <Button className="bg-[#CC785C] text-white hover:bg-[#B86548]">
                View Warehouse
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-[#E8E0D5]">
      <CardContent className="p-6 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((n, idx) => (
            <React.Fragment key={n}>
              <div className="flex items-center gap-2">
                <div
                  className={
                    n <= step
                      ? "h-8 w-8 rounded-full bg-[#CC785C] text-white flex items-center justify-center text-sm font-semibold"
                      : "h-8 w-8 rounded-full bg-[#E8E0D5] text-[#736B66] flex items-center justify-center text-sm font-semibold"
                  }
                >
                  {n}
                </div>
                <span
                  className={
                    n === step
                      ? "text-sm font-semibold text-[#2D2825] hidden sm:inline"
                      : "text-sm text-[#736B66] hidden sm:inline"
                  }
                >
                  {n === 1
                    ? "Source"
                    : n === 2
                    ? "Product"
                    : n === 3
                    ? "Destination"
                    : "Confirm"}
                </span>
              </div>
              {idx < 3 && (
                <div
                  className={
                    n < step
                      ? "flex-1 h-0.5 bg-[#CC785C] mx-2"
                      : "flex-1 h-0.5 bg-[#E8E0D5] mx-2"
                  }
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Source */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[#2D2825] flex items-center gap-2">
                <WarehouseIcon className="h-5 w-5 text-[#CC785C]" />
                Select Source Warehouse
              </h2>
              <p className="text-sm text-[#736B66] mt-1">
                เลือกคลังต้นทางที่จะนำสินค้าออก
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Source Warehouse</Label>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger className="bg-white border-[#E8E0D5]">
                  <SelectValue placeholder="Select a warehouse..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Product */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[#2D2825] flex items-center gap-2">
                <Package className="h-5 w-5 text-[#CC785C]" />
                Select Product
              </h2>
              <p className="text-sm text-[#736B66] mt-1">
                เลือกสินค้าจาก{" "}
                <span className="font-semibold text-[#2D2825]">
                  {fromWarehouse?.name}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-[#2D2825]">Product</Label>
              {loadingProducts ? (
                <div className="text-sm text-[#736B66] flex items-center gap-2 p-3 border border-[#E8E0D5] rounded-md bg-[#F5F0E8]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="text-sm text-[#736B66] p-4 border border-[#E8E0D5] rounded-md bg-[#F5F0E8]">
                  ไม่พบสินค้าที่มีสต็อกในคลังนี้
                </div>
              ) : (
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger className="bg-white border-[#E8E0D5]">
                    <SelectValue placeholder="Select a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.productId} value={p.productId}>
                        {p.productName} ({p.sku}) — Stock: {p.quantity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Destination + quantity */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[#2D2825] flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-[#CC785C]" />
                Destination & Quantity
              </h2>
              <p className="text-sm text-[#736B66] mt-1">
                เลือกคลังปลายทางและจำนวนสินค้าที่จะย้าย
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-[#2D2825]">Destination Warehouse</Label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger className="bg-white border-[#E8E0D5]">
                  <SelectValue placeholder="Select a warehouse..." />
                </SelectTrigger>
                <SelectContent>
                  {destinationOptions.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#2D2825]">
                Quantity (max {selectedProduct?.quantity ?? 0})
              </Label>
              <Input
                type="number"
                min={1}
                max={selectedProduct?.quantity ?? 0}
                value={quantity || ""}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="bg-white border-[#E8E0D5]"
              />
              <p className="text-xs text-[#736B66]">
                สามารถย้ายแบบบางส่วน (partial transfer) ได้
                ระบบจะหักจากต้นทางและเพิ่มที่ปลายทางอัตโนมัติ
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[#2D2825]">
                Confirm Transfer
              </h2>
              <p className="text-sm text-[#736B66] mt-1">
                ตรวจสอบรายละเอียดก่อนยืนยันการย้ายสต็อก
              </p>
            </div>

            <div className="rounded-lg border border-[#E8E0D5] bg-[#F5F0E8] p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#736B66] uppercase tracking-wider mb-1">
                    From
                  </p>
                  <p className="font-semibold text-[#2D2825]">
                    {fromWarehouse?.name}
                  </p>
                  <p className="text-xs font-mono text-[#736B66]">
                    {fromWarehouse?.code}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#736B66] uppercase tracking-wider mb-1">
                    To
                  </p>
                  <p className="font-semibold text-[#2D2825]">
                    {toWarehouse?.name}
                  </p>
                  <p className="text-xs font-mono text-[#736B66]">
                    {toWarehouse?.code}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-[#E8E0D5]">
                <p className="text-xs text-[#736B66] uppercase tracking-wider mb-1">
                  Product
                </p>
                <p className="font-semibold text-[#2D2825]">
                  {selectedProduct?.productName}
                </p>
                <p className="text-xs font-mono text-[#736B66]">
                  {selectedProduct?.sku}
                </p>
              </div>
              <div className="pt-4 border-t border-[#E8E0D5] flex items-baseline justify-between">
                <p className="text-xs text-[#736B66] uppercase tracking-wider">
                  Quantity
                </p>
                <p className="text-2xl font-bold text-[#CC785C]">
                  {quantity.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="text-sm font-medium text-destructive p-3 bg-destructive/10 rounded-md">
            {errorMsg}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || submitting}
            className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
          >
            Back
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-[#CC785C] text-white hover:bg-[#B86548]"
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#CC785C] text-white hover:bg-[#B86548]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                "Confirm Transfer"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
