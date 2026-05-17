"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthCard } from "@/components/auth/AuthCard";
import { signUp } from "@/server/actions/auth";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    accountType: z.enum(["USER", "MERCHANT"]),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
  })
  .refine(
    function checkPasswords(data) {
      return data.password === data.confirmPassword;
    },
    {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    },
  );

type RegisterFormValues = z.infer<typeof registerSchema>;

const inputClass =
  "bg-[#FFFFFF] border-[#E8E0D5] text-[#2D2825] placeholder:text-[#736B66] focus-visible:ring-[#CC785C] focus-visible:border-[#CC785C]";

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      accountType: "USER",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("email", values.email);
    formData.append("password", values.password);
    formData.append("role", values.accountType);

    const result = await signUp(formData);

    if (result.error) {
      setServerError(result.error);
      return;
    }

    // MERCHANT → onboarding wizard (จะถูก gate ด้วย admin approval ในขั้นถัดไป)
    // USER → ไปหน้า storefront ของผู้ซื้อ
    if (values.accountType === "MERCHANT") {
      router.push("/onboarding");
    } else {
      router.push("/storefront/products");
    }
    router.refresh();
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <AuthCard
      title="Create your account"
      description="Join our B2B marketplace to start wholesale purchasing or selling"
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#CC785C] hover:text-[#B86548] font-medium underline-offset-4 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={function renderName({ field }) {
              return (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Full Name / Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" className={inputClass} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="email"
            render={function renderEmail({ field }) {
              return (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      autoComplete="email"
                      className={inputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="accountType"
            render={function renderAccountType({ field }) {
              return (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Account Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#FFFFFF] border-[#E8E0D5]">
                      <SelectItem value="USER">Buyer (Instant access)</SelectItem>
                      <SelectItem value="MERCHANT">
                        Merchant (Requires admin approval)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="password"
            render={function renderPassword({ field }) {
              return (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={inputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={function renderConfirmPassword({ field }) {
              return (
                <FormItem>
                  <FormLabel className="text-[#2D2825]">Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={inputClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {serverError ? (
            <div className="flex items-start gap-2 text-sm font-medium text-[#B86548] bg-[#CC785C]/10 border border-[#CC785C]/30 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#CC785C] hover:bg-[#B86548] text-white shadow-sm mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
