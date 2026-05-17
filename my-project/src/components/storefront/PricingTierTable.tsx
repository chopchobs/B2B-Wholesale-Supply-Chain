import * as React from "react";
import type { Tier } from "@/store/useCartStore";

interface PricingTierTableProps {
  basePrice: number;
  tiers: Tier[];
  currentQuantity?: number;
}

export function PricingTierTable({
  basePrice,
  tiers,
  currentQuantity,
}: PricingTierTableProps): React.ReactElement {
  // เรียงระดับราคาตาม minQuantity จากน้อยไปมาก
  const sortedTiers = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);

  // หา tier ที่ active ในปริมาณปัจจุบัน
  function isActiveTier(tier: Tier): boolean {
    if (typeof currentQuantity !== "number") return false;
    const next = sortedTiers.find((t) => t.minQuantity > tier.minQuantity);
    const upper = next ? next.minQuantity : Infinity;
    return currentQuantity >= tier.minQuantity && currentQuantity < upper;
  }

  const baseActive =
    typeof currentQuantity === "number" &&
    (sortedTiers.length === 0 || currentQuantity < sortedTiers[0].minQuantity);

  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E0D5] bg-white">
      <div className="border-b border-[#E8E0D5] bg-[#F5F0E8] px-4 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#2D2825]">
          Volume Pricing
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E8E0D5] text-left text-xs uppercase tracking-wider text-[#736B66]">
            <th className="px-4 py-2 font-medium">Quantity</th>
            <th className="px-4 py-2 text-right font-medium">Unit Price</th>
            <th className="px-4 py-2 text-right font-medium">Savings</th>
          </tr>
        </thead>
        <tbody>
          <tr
            className={`border-b border-[#E8E0D5]/60 ${
              baseActive ? "bg-[#CC785C]/10" : ""
            }`}
          >
            <td className="px-4 py-3 text-[#2D2825]">1+ units</td>
            <td className="px-4 py-3 text-right font-medium text-[#2D2825]">
              ฿{basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>
            <td className="px-4 py-3 text-right text-[#736B66]">—</td>
          </tr>
          {sortedTiers.map((tier) => {
            const savings = basePrice > 0 ? ((basePrice - tier.unitPrice) / basePrice) * 100 : 0;
            const active = isActiveTier(tier);
            return (
              <tr
                key={tier.id}
                className={`border-b border-[#E8E0D5]/60 last:border-b-0 ${
                  active ? "bg-[#CC785C]/10" : ""
                }`}
              >
                <td className="px-4 py-3 text-[#2D2825]">
                  {tier.minQuantity}+ units
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[#CC785C]">
                  ฿{tier.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right text-[#736B66]">
                  {savings > 0 ? `${savings.toFixed(0)}% off` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
