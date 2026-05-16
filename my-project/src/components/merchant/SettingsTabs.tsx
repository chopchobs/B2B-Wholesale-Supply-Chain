"use client";

import React from "react";
import {
  Store,
  Receipt,
  ShoppingCart,
  Boxes,
  FileText,
  Warehouse as WarehouseIcon,
} from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { SettingsForm, type SettingsFieldDef } from "./SettingsForm";
import { WarehouseTableClient } from "./WarehouseTableClient";
import { AddWarehouseDialog } from "./AddWarehouseDialog";
import type {
  SettingItem,
  WarehouseItem,
} from "@/server/actions/settings";

// field defs สำหรับแต่ละ tab
const GENERAL_FIELDS: SettingsFieldDef[] = [
  {
    key: "store.name",
    label: "Store Name",
    type: "text",
    placeholder: "B2B Wholesale Store",
    required: true,
    description: "ชื่อร้านค้าที่จะแสดงในใบแจ้งหนี้และเอกสาร",
  },
  {
    key: "store.email",
    label: "Contact Email",
    type: "email",
    placeholder: "contact@store.com",
  },
  {
    key: "store.phone",
    label: "Phone",
    type: "text",
    placeholder: "02-XXX-XXXX",
  },
  {
    key: "store.address",
    label: "Address",
    type: "textarea",
    rows: 3,
    placeholder: "123 Business Rd. Bangkok",
  },
  {
    key: "store.logo_url",
    label: "Logo URL",
    type: "text",
    placeholder: "https://example.com/logo.png",
    description: "ลิงก์รูปโลโก้ (ใช้ในเอกสาร)",
  },
];

const TAX_CURRENCY_FIELDS: SettingsFieldDef[] = [
  {
    key: "tax.enabled",
    label: "Enable Tax",
    type: "boolean",
    description: "เปิด/ปิดการคิดภาษีอัตโนมัติในใบแจ้งหนี้",
  },
  {
    key: "tax.rate",
    label: "Tax Rate (%)",
    type: "number",
    min: 0,
    max: 100,
    step: 0.01,
    placeholder: "7",
    description: "อัตราภาษีเป็นเปอร์เซ็นต์ เช่น 7 = 7%",
  },
  {
    key: "tax.label",
    label: "Tax Label",
    type: "text",
    placeholder: "VAT",
    description: "ป้ายกำกับภาษีที่แสดงบนเอกสาร",
  },
  {
    key: "currency.code",
    label: "Currency Code",
    type: "text",
    placeholder: "THB",
    description: "รหัสสกุลเงิน ISO 4217 (THB, USD, EUR...)",
  },
  {
    key: "currency.symbol",
    label: "Currency Symbol",
    type: "text",
    placeholder: "฿",
  },
  {
    key: "currency.locale",
    label: "Locale",
    type: "text",
    placeholder: "th-TH",
    description: "Locale สำหรับ format ตัวเลข เช่น th-TH, en-US",
  },
];

const ORDER_FIELDS: SettingsFieldDef[] = [
  {
    key: "order.min_order_amount",
    label: "Minimum Order Amount",
    type: "number",
    min: 0,
    step: 0.01,
    placeholder: "0",
    description: "ยอดสั่งซื้อขั้นต่ำ (0 = ไม่จำกัด)",
  },
  {
    key: "order.auto_approve",
    label: "Auto-Approve Orders",
    type: "boolean",
    description: "อนุมัติคำสั่งซื้อใหม่โดยอัตโนมัติโดยไม่ต้องตรวจสอบด้วยตนเอง",
  },
];

const INVENTORY_FIELDS: SettingsFieldDef[] = [
  {
    key: "inventory.low_stock_default_threshold",
    label: "Default Low Stock Threshold",
    type: "number",
    min: 0,
    step: 1,
    placeholder: "10",
    description:
      "เกณฑ์เตือนสต็อกต่ำเริ่มต้นที่จะถูกใช้เมื่อสร้าง InventoryItem ใหม่",
  },
];

const INVOICE_FIELDS: SettingsFieldDef[] = [
  {
    key: "invoice.payment_terms_days",
    label: "Payment Terms (Days)",
    type: "number",
    min: 1,
    step: 1,
    placeholder: "30",
    description: "จำนวนวันที่ลูกค้าต้องชำระหลังออกใบแจ้งหนี้ (Net X)",
  },
  {
    key: "invoice.notes_default",
    label: "Default Invoice Notes",
    type: "textarea",
    rows: 3,
    placeholder: "ขอบคุณที่ใช้บริการ",
    description: "ข้อความที่จะใส่ใน notes ของใบแจ้งหนี้โดยอัตโนมัติ",
  },
];

interface SettingsTabsProps {
  settings: SettingItem[];
  warehouses: WarehouseItem[];
}

export function SettingsTabs({
  settings,
  warehouses,
}: SettingsTabsProps): React.ReactElement {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="flex flex-wrap h-auto">
        <TabsTrigger value="general">
          <Store className="h-4 w-4 mr-1.5" />
          General
        </TabsTrigger>
        <TabsTrigger value="tax">
          <Receipt className="h-4 w-4 mr-1.5" />
          Tax & Currency
        </TabsTrigger>
        <TabsTrigger value="orders">
          <ShoppingCart className="h-4 w-4 mr-1.5" />
          Orders
        </TabsTrigger>
        <TabsTrigger value="inventory">
          <Boxes className="h-4 w-4 mr-1.5" />
          Inventory
        </TabsTrigger>
        <TabsTrigger value="invoices">
          <FileText className="h-4 w-4 mr-1.5" />
          Invoices
        </TabsTrigger>
        <TabsTrigger value="warehouses">
          <WarehouseIcon className="h-4 w-4 mr-1.5" />
          Warehouses
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <SettingsForm
          title="General"
          description="ข้อมูลร้านค้า ใช้แสดงบนใบแจ้งหนี้และเอกสารต่าง ๆ"
          fields={GENERAL_FIELDS}
          settings={settings}
        />
      </TabsContent>

      <TabsContent value="tax">
        <SettingsForm
          title="Tax & Currency"
          description="ตั้งค่าภาษีและสกุลเงินที่ใช้ในระบบ"
          fields={TAX_CURRENCY_FIELDS}
          settings={settings}
        />
      </TabsContent>

      <TabsContent value="orders">
        <SettingsForm
          title="Orders"
          description="กฎสำหรับการสั่งซื้อสินค้า"
          fields={ORDER_FIELDS}
          settings={settings}
        />
      </TabsContent>

      <TabsContent value="inventory">
        <SettingsForm
          title="Inventory"
          description="ค่าเริ่มต้นสำหรับการบริหารคลัง"
          fields={INVENTORY_FIELDS}
          settings={settings}
        />
      </TabsContent>

      <TabsContent value="invoices">
        <SettingsForm
          title="Invoices"
          description="ค่าเริ่มต้นสำหรับใบแจ้งหนี้"
          fields={INVOICE_FIELDS}
          settings={settings}
        />
      </TabsContent>

      <TabsContent value="warehouses">
        <div className="bg-white border border-[#E8E0D5] rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold text-[#2D2825]">
                Warehouses
              </h2>
              <p className="text-sm text-[#736B66] mt-1">
                จัดการคลังสินค้าและกำหนดคลังเริ่มต้น
              </p>
            </div>
            <AddWarehouseDialog />
          </div>
          <WarehouseTableClient warehouses={warehouses} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
