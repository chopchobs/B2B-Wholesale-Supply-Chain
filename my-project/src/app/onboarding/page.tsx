"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OnboardingSteps } from "@/components/auth/OnboardingSteps";
import {
  createShop,
  createFirstProduct,
  type BusinessType,
} from "@/server/actions/onboarding";

type WizardStep = 1 | 2 | 3;

interface ShopFormState {
  name: string;
  description: string;
  businessType: BusinessType;
}

interface ProductFormState {
  name: string;
  sku: string;
  price: string;
  stock: string;
}

interface InviteFormState {
  email: string;
  role: "MANAGER" | "STAFF";
}

const STEP_LABELS = ["Shop Setup", "First Product", "Invite Team"];

const inputClass =
  "bg-[#FFFFFF] border-[#E8E0D5] text-[#2D2825] placeholder:text-[#736B66] focus-visible:ring-[#CC785C] focus-visible:border-[#CC785C]";

export default function OnboardingPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

  const [shop, setShop] = useState<ShopFormState>({
    name: "",
    description: "",
    businessType: "WHOLESALE",
  });

  const [product, setProduct] = useState<ProductFormState>({
    name: "",
    sku: "",
    price: "",
    stock: "",
  });

  const [invite, setInvite] = useState<InviteFormState>({
    email: "",
    role: "STAFF",
  });

  function finish() {
    router.push("/merchant");
    router.refresh();
  }

  async function handleStep1Next() {
    setErrorMessage(null);
    if (shop.name.trim().length < 2) {
      setErrorMessage("Shop name must be at least 2 characters.");
      return;
    }
    setIsSubmitting(true);
    const result = await createShop({
      name: shop.name.trim(),
      description: shop.description.trim() || null,
      businessType: shop.businessType,
    });
    setIsSubmitting(false);

    if (result.error || !result.data) {
      setErrorMessage(result.error ?? "Failed to create shop.");
      return;
    }
    setShopId(result.data.id);
    setCurrentStep(2);
  }

  async function handleStep2Next() {
    setErrorMessage(null);
    if (!shopId) {
      setErrorMessage("Shop is missing. Please go back and complete Step 1.");
      return;
    }
    const priceNum = Number(product.price);
    const stockNum = Number(product.stock);
    if (!product.name.trim() || !product.sku.trim()) {
      setErrorMessage("Product name and SKU are required.");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setErrorMessage("Please enter a valid price.");
      return;
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      setErrorMessage("Please enter a valid stock quantity.");
      return;
    }

    setIsSubmitting(true);
    const result = await createFirstProduct({
      shopId,
      name: product.name.trim(),
      sku: product.sku.trim(),
      basePrice: priceNum,
      stock: stockNum,
    });
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }
    setCurrentStep(3);
  }

  function handleStep2Skip() {
    setErrorMessage(null);
    setCurrentStep(3);
  }

  function handleStep3Send() {
    setErrorMessage(null);
    if (!invite.email.trim()) {
      setErrorMessage("Please enter an email address to invite.");
      return;
    }
    // TODO (out of scope Phase 21): integrate ระบบส่งอีเมลจริง
    setInviteSent(true);
  }

  function handleBack() {
    setErrorMessage(null);
    if (currentStep === 2) setCurrentStep(1);
    else if (currentStep === 3) setCurrentStep(2);
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-[#2D2825]">
            Let&apos;s set up your store
          </h1>
          <p className="text-sm text-[#736B66]">
            ใช้เวลาประมาณ 2 นาที — ตั้งค่าร้าน เพิ่มสินค้าแรก และเชิญทีมเข้ามาช่วย
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-2xl px-6 sm:px-10 py-6">
          <OnboardingSteps currentStep={currentStep} totalSteps={3} labels={STEP_LABELS} />
        </div>

        <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-2xl p-6 sm:p-10 shadow-sm">
          {currentStep === 1 ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-[#2D2825]">Shop setup</h2>
                <p className="text-sm text-[#736B66]">
                  บอกเราเกี่ยวกับร้านของคุณ ข้อมูลนี้จะแสดงให้ลูกค้าเห็น
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shop-name" className="text-[#2D2825]">
                    Shop name <span className="text-[#CC785C]">*</span>
                  </Label>
                  <Input
                    id="shop-name"
                    placeholder="Acme Wholesale Co., Ltd."
                    className={inputClass}
                    value={shop.name}
                    onChange={function onChange(e) {
                      setShop({ ...shop, name: e.target.value });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shop-desc" className="text-[#2D2825]">
                    Description
                  </Label>
                  <Textarea
                    id="shop-desc"
                    placeholder="What does your business sell?"
                    rows={3}
                    className={inputClass}
                    value={shop.description}
                    onChange={function onChange(e) {
                      setShop({ ...shop, description: e.target.value });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#2D2825]">Business type</Label>
                  <Select
                    value={shop.businessType}
                    onValueChange={function onChange(v: string) {
                      setShop({ ...shop, businessType: v as BusinessType });
                    }}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FFFFFF] border-[#E8E0D5]">
                      <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                      <SelectItem value="RETAIL">Retail</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleStep1Next}
                  disabled={isSubmitting}
                  className="bg-[#CC785C] hover:bg-[#B86548] text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-[#2D2825]">Add your first product</h2>
                <p className="text-sm text-[#736B66]">
                  เพิ่มสินค้าตัวแรกของคุณ จะปรับแต่งเพิ่มเติมได้ทีหลังในหน้า Products
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="p-name" className="text-[#2D2825]">
                    Product name <span className="text-[#CC785C]">*</span>
                  </Label>
                  <Input
                    id="p-name"
                    placeholder="Premium Coffee Beans 1kg"
                    className={inputClass}
                    value={product.name}
                    onChange={function onChange(e) {
                      setProduct({ ...product, name: e.target.value });
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="p-sku" className="text-[#2D2825]">
                      SKU <span className="text-[#CC785C]">*</span>
                    </Label>
                    <Input
                      id="p-sku"
                      placeholder="SKU-001"
                      className={inputClass}
                      value={product.sku}
                      onChange={function onChange(e) {
                        setProduct({ ...product, sku: e.target.value });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-price" className="text-[#2D2825]">
                      Price (THB) <span className="text-[#CC785C]">*</span>
                    </Label>
                    <Input
                      id="p-price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className={inputClass}
                      value={product.price}
                      onChange={function onChange(e) {
                        setProduct({ ...product, price: e.target.value });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-stock" className="text-[#2D2825]">
                      Stock <span className="text-[#CC785C]">*</span>
                    </Label>
                    <Input
                      id="p-stock"
                      type="number"
                      min="0"
                      placeholder="0"
                      className={inputClass}
                      value={product.stock}
                      onChange={function onChange(e) {
                        setProduct({ ...product, stock: e.target.value });
                      }}
                    />
                  </div>
                </div>
              </div>

              {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="text-[#736B66] hover:text-[#2D2825] hover:bg-[#F5F0E8]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={handleStep2Skip}
                    disabled={isSubmitting}
                    className="border-[#E8E0D5] text-[#2D2825] hover:bg-[#F5F0E8]"
                  >
                    Skip for now
                  </Button>
                  <Button
                    onClick={handleStep2Next}
                    disabled={isSubmitting}
                    className="bg-[#CC785C] hover:bg-[#B86548] text-white"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-[#2D2825]">Invite your team</h2>
                <p className="text-sm text-[#736B66]">
                  เชิญสมาชิกเข้ามาช่วยจัดการร้าน (ข้ามได้ — เชิญทีหลังในหน้า Settings)
                </p>
              </div>

              {inviteSent ? (
                <div className="flex items-start gap-3 bg-[#D4A574]/15 border border-[#D4A574]/40 p-4 rounded-md">
                  <CheckCircle2 className="h-5 w-5 text-[#CC785C] mt-0.5" />
                  <div className="text-sm text-[#2D2825]">
                    <p className="font-medium">Invitation queued</p>
                    <p className="text-[#736B66]">
                      ส่งคำเชิญไปที่ {invite.email} แล้ว (ระบบจะส่งอีเมลจริงในขั้นถัดไป)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="inv-email" className="text-[#2D2825]">
                      Email
                    </Label>
                    <Input
                      id="inv-email"
                      type="email"
                      placeholder="teammate@example.com"
                      className={inputClass}
                      value={invite.email}
                      onChange={function onChange(e) {
                        setInvite({ ...invite, email: e.target.value });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#2D2825]">Role</Label>
                    <Select
                      value={invite.role}
                      onValueChange={function onChange(v: string) {
                        setInvite({ ...invite, role: v as "MANAGER" | "STAFF" });
                      }}
                    >
                      <SelectTrigger className={inputClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#FFFFFF] border-[#E8E0D5]">
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="STAFF">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-[#736B66] hover:text-[#2D2825] hover:bg-[#F5F0E8]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  {!inviteSent ? (
                    <Button
                      variant="outline"
                      onClick={handleStep3Send}
                      className="border-[#CC785C] text-[#CC785C] hover:bg-[#CC785C]/10"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send invite
                    </Button>
                  ) : null}
                  <Button
                    onClick={finish}
                    className="bg-[#CC785C] hover:bg-[#B86548] text-white"
                  >
                    Finish &amp; go to dashboard
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
}

function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-2 text-sm font-medium text-[#B86548] bg-[#CC785C]/10 border border-[#CC785C]/30 p-3 rounded-md">
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
