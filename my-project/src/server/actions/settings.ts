"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, SettingCategory, SettingType } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface SettingItem {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  category: SettingCategory;
  description: string | null;
  updatedBy: string | null;
  updatedAt: Date;
}

export interface WarehouseItem {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  country: string | null;
  isDefault: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSettingInput {
  key: string;
  value: string;
}

export interface CreateWarehouseInput {
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  isDefault?: boolean;
  notes?: string | null;
}

export interface UpdateWarehouseInput {
  name?: string;
  code?: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  isActive?: boolean;
  notes?: string | null;
}

// --- Default Settings Seed ---

interface DefaultSettingDef {
  key: string;
  value: string;
  type: SettingType;
  category: SettingCategory;
  description: string;
}

const DEFAULT_SETTINGS: DefaultSettingDef[] = [
  // General — ข้อมูลร้านค้า
  {
    key: "store.name",
    value: "B2B Wholesale Store",
    type: SettingType.STRING,
    category: SettingCategory.GENERAL,
    description: "ชื่อร้านค้าที่แสดงในหัวเอกสาร",
  },
  {
    key: "store.email",
    value: "",
    type: SettingType.STRING,
    category: SettingCategory.GENERAL,
    description: "อีเมลติดต่อร้านค้า",
  },
  {
    key: "store.phone",
    value: "",
    type: SettingType.STRING,
    category: SettingCategory.GENERAL,
    description: "เบอร์โทรร้านค้า",
  },
  {
    key: "store.address",
    value: "",
    type: SettingType.STRING,
    category: SettingCategory.GENERAL,
    description: "ที่อยู่ร้านค้า",
  },
  {
    key: "store.logo_url",
    value: "",
    type: SettingType.STRING,
    category: SettingCategory.GENERAL,
    description: "URL โลโก้ร้านค้า",
  },
  // Tax — ภาษี
  {
    key: "tax.rate",
    value: "7",
    type: SettingType.NUMBER,
    category: SettingCategory.TAX,
    description: "อัตราภาษี (%) สำหรับใบแจ้งหนี้",
  },
  {
    key: "tax.enabled",
    value: "true",
    type: SettingType.BOOLEAN,
    category: SettingCategory.TAX,
    description: "เปิด/ปิดการคิดภาษีในใบแจ้งหนี้",
  },
  {
    key: "tax.label",
    value: "VAT",
    type: SettingType.STRING,
    category: SettingCategory.TAX,
    description: "ป้ายกำกับภาษีที่แสดงในเอกสาร",
  },
  // Currency
  {
    key: "currency.code",
    value: "THB",
    type: SettingType.STRING,
    category: SettingCategory.CURRENCY,
    description: "รหัสสกุลเงิน ISO 4217",
  },
  {
    key: "currency.symbol",
    value: "฿",
    type: SettingType.STRING,
    category: SettingCategory.CURRENCY,
    description: "สัญลักษณ์สกุลเงิน",
  },
  {
    key: "currency.locale",
    value: "th-TH",
    type: SettingType.STRING,
    category: SettingCategory.CURRENCY,
    description: "Locale สำหรับการ format ตัวเลข",
  },
  // Orders
  {
    key: "order.min_order_amount",
    value: "0",
    type: SettingType.NUMBER,
    category: SettingCategory.PRICING,
    description: "ยอดสั่งซื้อขั้นต่ำ (0 = ไม่จำกัด)",
  },
  {
    key: "order.auto_approve",
    value: "false",
    type: SettingType.BOOLEAN,
    category: SettingCategory.PRICING,
    description: "อนุมัติคำสั่งซื้อโดยอัตโนมัติ",
  },
  // Inventory
  {
    key: "inventory.low_stock_default_threshold",
    value: "10",
    type: SettingType.NUMBER,
    category: SettingCategory.WAREHOUSE,
    description: "เกณฑ์เตือนสต็อกต่ำเริ่มต้นสำหรับสินค้าใหม่",
  },
  // Invoice
  {
    key: "invoice.payment_terms_days",
    value: "30",
    type: SettingType.NUMBER,
    category: SettingCategory.GENERAL,
    description: "จำนวนวันเครดิตเริ่มต้น (Net X)",
  },
  {
    key: "invoice.notes_default",
    value: "",
    type: SettingType.STRING,
    category: SettingCategory.GENERAL,
    description: "ข้อความหมายเหตุเริ่มต้นในใบแจ้งหนี้",
  },
];

// --- Helpers ---

function toSettingItem(s: {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  category: SettingCategory;
  description: string | null;
  updatedBy: string | null;
  updatedAt: Date;
}): SettingItem {
  return {
    id: s.id,
    key: s.key,
    value: s.value,
    type: s.type,
    category: s.category,
    description: s.description,
    updatedBy: s.updatedBy,
    updatedAt: s.updatedAt,
  };
}

function toWarehouseItem(w: {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  country: string | null;
  isDefault: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WarehouseItem {
  return {
    id: w.id,
    name: w.name,
    code: w.code,
    address: w.address,
    city: w.city,
    country: w.country,
    isDefault: w.isDefault,
    isActive: w.isActive,
    notes: w.notes,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

// ตรวจสอบค่าตาม type ก่อนบันทึก
function validateValueByType(value: string, type: SettingType): string | null {
  if (type === SettingType.NUMBER) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "Value must be a valid number.";
    return null;
  }
  if (type === SettingType.BOOLEAN) {
    if (value !== "true" && value !== "false") {
      return "Value must be 'true' or 'false'.";
    }
    return null;
  }
  if (type === SettingType.JSON) {
    try {
      JSON.parse(value);
    } catch {
      return "Value must be valid JSON.";
    }
    return null;
  }
  return null;
}

// --- Settings Queries ---

export async function getSettings(
  category?: SettingCategory
): Promise<ActionResult<SettingItem[]>> {
  try {
    const where: Prisma.SettingWhereInput = {};
    if (category) where.category = category;

    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: "asc" },
    });

    return { data: settings.map(toSettingItem), error: null };
  } catch (error: unknown) {
    console.error("getSettings failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load settings.";
    return { data: null, error: message };
  }
}

export async function getSetting(
  key: string
): Promise<ActionResult<SettingItem>> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting) {
      return { data: null, error: "Setting not found." };
    }
    return { data: toSettingItem(setting), error: null };
  } catch (error: unknown) {
    console.error("getSetting failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load setting.";
    return { data: null, error: message };
  }
}

// helper สำหรับ server-side ที่ต้องการเพียงค่า raw (ใช้ใน invoices ฯลฯ)
export async function getSettingValue(
  key: string,
  fallback: string
): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } });
    return setting?.value ?? fallback;
  } catch (error: unknown) {
    console.error("getSettingValue failed:", error);
    return fallback;
  }
}

// --- Settings Mutations ---

export async function updateSetting(
  key: string,
  value: string,
  userId?: string
): Promise<ActionResult<SettingItem>> {
  try {
    // ตรวจสอบ key มีอยู่จริง (เพื่อรู้ type ที่ถูกต้อง)
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) {
      return { data: null, error: `Unknown setting key: ${key}` };
    }

    const validationError = validateValueByType(value, existing.type);
    if (validationError) {
      return { data: null, error: validationError };
    }

    const updated = await prisma.setting.update({
      where: { key },
      data: {
        value,
        updatedBy: userId ?? null,
      },
    });

    revalidatePath("/merchant/settings");
    revalidatePath("/merchant");

    return { data: toSettingItem(updated), error: null };
  } catch (error: unknown) {
    console.error("updateSetting failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update setting.";
    return { data: null, error: message };
  }
}

export async function updateSettingsBatch(
  settings: UpdateSettingInput[],
  userId?: string
): Promise<ActionResult<SettingItem[]>> {
  try {
    if (!Array.isArray(settings) || settings.length === 0) {
      return { data: [], error: null };
    }

    // โหลด setting ทั้งหมดที่อ้างถึง เพื่อตรวจ type
    const keys = settings.map((s) => s.key);
    const existing = await prisma.setting.findMany({
      where: { key: { in: keys } },
    });
    const existingByKey = new Map(existing.map((s) => [s.key, s]));

    // ตรวจทุกรายการก่อน (อย่าให้ commit แค่บางส่วน)
    for (const s of settings) {
      const ex = existingByKey.get(s.key);
      if (!ex) {
        return { data: null, error: `Unknown setting key: ${s.key}` };
      }
      const err = validateValueByType(s.value, ex.type);
      if (err) {
        return { data: null, error: `${s.key}: ${err}` };
      }
    }

    // ทำเป็น transaction เพื่อ atomicity
    const updated = await prisma.$transaction(
      settings.map((s) =>
        prisma.setting.update({
          where: { key: s.key },
          data: { value: s.value, updatedBy: userId ?? null },
        })
      )
    );

    revalidatePath("/merchant/settings");
    revalidatePath("/merchant");

    return { data: updated.map(toSettingItem), error: null };
  } catch (error: unknown) {
    console.error("updateSettingsBatch failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update settings.";
    return { data: null, error: message };
  }
}

// seed default settings ถ้ายังไม่มี — เรียกตอน load หน้า settings
export async function initDefaultSettings(): Promise<
  ActionResult<{ created: number }>
> {
  try {
    const keys = DEFAULT_SETTINGS.map((s) => s.key);
    const existing = await prisma.setting.findMany({
      where: { key: { in: keys } },
      select: { key: true },
    });
    const existingKeys = new Set(existing.map((s) => s.key));

    const toCreate = DEFAULT_SETTINGS.filter((s) => !existingKeys.has(s.key));
    if (toCreate.length === 0) {
      return { data: { created: 0 }, error: null };
    }

    await prisma.setting.createMany({
      data: toCreate.map((s) => ({
        key: s.key,
        value: s.value,
        type: s.type,
        category: s.category,
        description: s.description,
      })),
      skipDuplicates: true,
    });

    return { data: { created: toCreate.length }, error: null };
  } catch (error: unknown) {
    console.error("initDefaultSettings failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to seed default settings.";
    return { data: null, error: message };
  }
}

// --- Warehouse Queries ---

export async function getWarehouses(): Promise<ActionResult<WarehouseItem[]>> {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: [{ isDefault: "desc" }, { code: "asc" }],
    });
    return { data: warehouses.map(toWarehouseItem), error: null };
  } catch (error: unknown) {
    console.error("getWarehouses failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load warehouses.";
    return { data: null, error: message };
  }
}

// --- Warehouse Mutations ---

export async function createWarehouse(
  input: CreateWarehouseInput
): Promise<ActionResult<WarehouseItem>> {
  try {
    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();
    if (!name) return { data: null, error: "Warehouse name is required." };
    if (!code) return { data: null, error: "Warehouse code is required." };

    // ตรวจ code ซ้ำ
    const existing = await prisma.warehouse.findUnique({ where: { code } });
    if (existing) {
      return { data: null, error: `Warehouse code '${code}' already exists.` };
    }

    // ถ้าเซ็ตเป็น default ให้ unset ของเดิม
    if (input.isDefault) {
      await prisma.warehouse.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const created = await prisma.warehouse.create({
      data: {
        name,
        code,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        country: input.country?.trim() || null,
        notes: input.notes?.trim() || null,
        isDefault: input.isDefault ?? false,
        isActive: true,
      },
    });

    revalidatePath("/merchant/settings");
    return { data: toWarehouseItem(created), error: null };
  } catch (error: unknown) {
    console.error("createWarehouse failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create warehouse.";
    return { data: null, error: message };
  }
}

export async function updateWarehouse(
  id: string,
  input: UpdateWarehouseInput
): Promise<ActionResult<WarehouseItem>> {
  try {
    const existing = await prisma.warehouse.findUnique({ where: { id } });
    if (!existing) {
      return { data: null, error: "Warehouse not found." };
    }

    const data: Prisma.WarehouseUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.code !== undefined) {
      const newCode = input.code.trim().toUpperCase();
      if (newCode !== existing.code) {
        const dup = await prisma.warehouse.findUnique({
          where: { code: newCode },
        });
        if (dup) {
          return {
            data: null,
            error: `Warehouse code '${newCode}' already exists.`,
          };
        }
      }
      data.code = newCode;
    }
    if (input.address !== undefined) data.address = input.address?.trim() || null;
    if (input.city !== undefined) data.city = input.city?.trim() || null;
    if (input.country !== undefined)
      data.country = input.country?.trim() || null;
    if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const updated = await prisma.warehouse.update({
      where: { id },
      data,
    });

    revalidatePath("/merchant/settings");
    return { data: toWarehouseItem(updated), error: null };
  } catch (error: unknown) {
    console.error("updateWarehouse failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update warehouse.";
    return { data: null, error: message };
  }
}

export async function setDefaultWarehouse(
  id: string
): Promise<ActionResult<WarehouseItem>> {
  try {
    const existing = await prisma.warehouse.findUnique({ where: { id } });
    if (!existing) {
      return { data: null, error: "Warehouse not found." };
    }

    // ทำใน transaction: unset ทั้งหมดก่อน แล้ว set ตัวที่เลือก
    const [, updated] = await prisma.$transaction([
      prisma.warehouse.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      }),
      prisma.warehouse.update({
        where: { id },
        data: { isDefault: true, isActive: true },
      }),
    ]);

    revalidatePath("/merchant/settings");
    return { data: toWarehouseItem(updated), error: null };
  } catch (error: unknown) {
    console.error("setDefaultWarehouse failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to set default warehouse.";
    return { data: null, error: message };
  }
}
