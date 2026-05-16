"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, CheckCircle2 } from "lucide-react";

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
import {
  updateSettingsBatch,
  type SettingItem,
} from "@/server/actions/settings";

export type SettingsFieldType =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "boolean";

export interface SettingsFieldDef {
  key: string;
  label: string;
  description?: string;
  type: SettingsFieldType;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
}

interface SettingsFormProps {
  title: string;
  description?: string;
  fields: SettingsFieldDef[];
  settings: SettingItem[];
}

// แปลง value string -> form value ตาม type
function parseValue(raw: string | undefined, type: SettingsFieldType): unknown {
  if (raw === undefined || raw === null) {
    if (type === "boolean") return false;
    if (type === "number") return "";
    return "";
  }
  if (type === "boolean") return raw === "true";
  if (type === "number") return raw === "" ? "" : raw;
  return raw;
}

// แปลง form value -> string สำหรับเก็บใน DB
function stringifyValue(value: unknown, type: SettingsFieldType): string {
  if (type === "boolean") return value === true ? "true" : "false";
  if (type === "number") {
    if (value === "" || value === null || value === undefined) return "0";
    return String(value);
  }
  return value === null || value === undefined ? "" : String(value);
}

export function SettingsForm({
  title,
  description,
  fields,
  settings,
}: SettingsFormProps): React.ReactElement {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // map settings by key เพื่อหา default value ได้ไว
  const settingsByKey = React.useMemo(() => {
    const m = new Map<string, SettingItem>();
    for (const s of settings) m.set(s.key, s);
    return m;
  }, [settings]);

  // สร้าง schema แบบ dynamic ตาม fields
  const schema = React.useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const f of fields) {
      if (f.type === "boolean") {
        shape[f.key] = z.boolean();
      } else if (f.type === "number") {
        let n: z.ZodTypeAny = z.coerce.number({
          message: `${f.label} must be a number`,
        });
        if (f.required) {
          n = (n as z.ZodNumber).min(f.min ?? 0, {
            message: `${f.label} is required`,
          });
        }
        shape[f.key] = n;
      } else if (f.type === "email") {
        shape[f.key] = f.required
          ? z.string().email({ message: "Invalid email." })
          : z
              .string()
              .email({ message: "Invalid email." })
              .or(z.literal(""))
              .optional();
      } else {
        shape[f.key] = f.required
          ? z.string().min(1, { message: `${f.label} is required` })
          : z.string().optional();
      }
    }
    return z.object(shape);
  }, [fields]);

  type FormValues = Record<string, string | number | boolean>;

  const defaultValues = React.useMemo(() => {
    const dv: FormValues = {};
    for (const f of fields) {
      const raw = settingsByKey.get(f.key)?.value;
      dv[f.key] = parseValue(raw, f.type) as string | number | boolean;
    }
    return dv;
  }, [fields, settingsByKey]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues,
  });

  async function onSubmit(values: FormValues): Promise<void> {
    setServerError(null);
    setSuccessMsg(null);

    const payload = fields.map((f) => ({
      key: f.key,
      value: stringifyValue(values[f.key], f.type),
    }));

    const res = await updateSettingsBatch(payload);
    if (res.error) {
      setServerError(res.error);
      return;
    }
    setSuccessMsg("บันทึกการตั้งค่าเรียบร้อย");
    startTransition(() => router.refresh());
    // ซ่อน success message หลัง 3 วินาที
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="bg-white border border-[#E8E0D5] rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#2D2825]">{title}</h2>
        {description && (
          <p className="text-sm text-[#736B66] mt-1">{description}</p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {fields.map((f) => (
            <FormField
              key={f.key}
              control={form.control}
              name={f.key}
              render={({ field }) => (
                <FormItem
                  className={
                    f.type === "boolean"
                      ? "flex items-center justify-between rounded-md border border-[#E8E0D5] p-4"
                      : ""
                  }
                >
                  {f.type === "boolean" ? (
                    <>
                      <div className="space-y-0.5 pr-4">
                        <FormLabel className="text-[#2D2825] text-base">
                          {f.label}
                        </FormLabel>
                        {f.description && (
                          <FormDescription className="text-[#736B66]">
                            {f.description}
                          </FormDescription>
                        )}
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === true}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-[#CC785C]"
                        />
                      </FormControl>
                    </>
                  ) : (
                    <>
                      <FormLabel className="text-[#2D2825]">
                        {f.label}
                      </FormLabel>
                      <FormControl>
                        {f.type === "textarea" ? (
                          <Textarea
                            rows={f.rows ?? 3}
                            placeholder={f.placeholder}
                            value={String(field.value ?? "")}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        ) : (
                          <Input
                            type={
                              f.type === "number"
                                ? "number"
                                : f.type === "email"
                                  ? "email"
                                  : "text"
                            }
                            step={f.step}
                            min={f.min}
                            max={f.max}
                            placeholder={f.placeholder}
                            value={
                              field.value === undefined || field.value === null
                                ? ""
                                : String(field.value)
                            }
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        )}
                      </FormControl>
                      {f.description && (
                        <FormDescription className="text-[#736B66]">
                          {f.description}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </>
                  )}
                </FormItem>
              )}
            />
          ))}

          {serverError && (
            <div className="text-sm font-medium text-destructive p-3 bg-destructive/10 rounded-md">
              {serverError}
            </div>
          )}

          {successMsg && (
            <div className="text-sm font-medium text-[#2D2825] p-3 bg-[#D4A574]/15 border border-[#D4A574]/40 rounded-md flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#CC785C]" />
              {successMsg}
            </div>
          )}

          <div className="flex justify-end pt-2">
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
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
