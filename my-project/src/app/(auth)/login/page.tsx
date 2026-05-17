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
import { AuthCard } from "@/components/auth/AuthCard";
import { signIn } from "@/server/actions/auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);

    const result = await signIn(formData);

    if (result.error) {
      setServerError(result.error);
    } else {
      router.push("/products");
      router.refresh();
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your B2B Wholesale account to continue"
      footer={
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-[#CC785C] hover:text-[#B86548] font-medium underline-offset-4 hover:underline"
          >
            Register here
          </Link>
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                      className="bg-[#FFFFFF] border-[#E8E0D5] text-[#2D2825] placeholder:text-[#736B66] focus-visible:ring-[#CC785C] focus-visible:border-[#CC785C]"
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
            name="password"
            render={function renderPassword({ field }) {
              return (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-[#2D2825]">Password</FormLabel>
                    <Link
                      href="#"
                      className="text-xs text-[#CC785C] hover:text-[#B86548] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="bg-[#FFFFFF] border-[#E8E0D5] text-[#2D2825] placeholder:text-[#736B66] focus-visible:ring-[#CC785C] focus-visible:border-[#CC785C]"
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
            className="w-full bg-[#CC785C] hover:bg-[#B86548] text-white shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
