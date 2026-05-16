import React from "react";
import Link from "next/link";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getSettings,
  getWarehouses,
  initDefaultSettings,
} from "@/server/actions/settings";
import { SettingsTabs } from "@/components/merchant/SettingsTabs";

export const dynamic = "force-dynamic";

export default async function MerchantSettingsPage(): Promise<React.ReactElement> {
  // seed default settings ครั้งแรก (idempotent)
  await initDefaultSettings();

  const [settingsRes, warehousesRes] = await Promise.all([
    getSettings(),
    getWarehouses(),
  ]);

  const settings = settingsRes.data ?? [];
  const warehouses = warehousesRes.data ?? [];
  const loadError = settingsRes.error ?? warehousesRes.error;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      <div className="flex items-center gap-2">
        <Link href="/merchant">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D2825] flex items-center gap-2">
            <SettingsIcon className="h-7 w-7 text-[#CC785C]" />
            Settings & Configuration
          </h1>
          <p className="text-[#736B66] mt-1">
            ตั้งค่าระบบ ภาษี สกุลเงิน คลังสินค้า และอื่น ๆ
          </p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {loadError}
        </div>
      )}

      <SettingsTabs settings={settings} warehouses={warehouses} />
    </div>
  );
}
