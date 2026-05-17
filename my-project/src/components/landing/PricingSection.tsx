import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Phase 19: Pricing — teaser 3 ระดับ ยังไม่ตัดสินใจ final price ให้ user customize ภายหลัง
interface PricingTier {
  name: string;
  description: string;
  price: string;
  priceSuffix: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
}

const TIERS: PricingTier[] = [
  {
    name: "Starter",
    description: "For small wholesale teams just getting started.",
    price: "฿0",
    priceSuffix: "/ month",
    features: [
      "Up to 500 SKUs",
      "2 team members",
      "Basic inventory & orders",
      "Email support",
    ],
    ctaLabel: "Start free",
    ctaHref: "/register",
  },
  {
    name: "Growth",
    description: "Scale your operations with automation and integrations.",
    price: "฿2,990",
    priceSuffix: "/ month",
    features: [
      "Unlimited SKUs",
      "Up to 15 team members",
      "Suppliers, POs & invoicing",
      "Shipping integrations",
      "Priority support",
    ],
    ctaLabel: "Get started",
    ctaHref: "/register",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "Custom workflows, SLAs and dedicated infrastructure.",
    price: "Custom",
    priceSuffix: "",
    features: [
      "Unlimited team members",
      "SSO & advanced permissions",
      "Custom integrations & API",
      "Dedicated success manager",
      "99.99% uptime SLA",
    ],
    ctaLabel: "Talk to sales",
    ctaHref: "#contact",
  },
];

export function PricingSection(): React.ReactElement {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="bg-[#F5F0E8] py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#CC785C]">
            Pricing
          </p>
          <h2
            id="pricing-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-[#2D2825] sm:text-4xl"
          >
            Plans that grow with your business
          </h2>
          <p className="mt-4 text-base text-[#736B66]">
            Start free and upgrade as you scale. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[#736B66]">
          Prices in THB. All plans include a 14-day free trial of paid features.
        </p>
      </div>
    </section>
  );
}

interface PricingCardProps {
  tier: PricingTier;
}

function PricingCard({ tier }: PricingCardProps): React.ReactElement {
  const isHighlighted = Boolean(tier.highlighted);
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border p-7 transition-all",
        isHighlighted
          ? "border-[#CC785C] bg-white shadow-xl shadow-[#CC785C]/15 lg:-translate-y-2"
          : "border-[#E8E0D5] bg-white shadow-sm hover:shadow-md",
      )}
    >
      {isHighlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#CC785C] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-md">
          Most popular
        </span>
      )}

      <header>
        <h3 className="text-lg font-semibold text-[#2D2825]">{tier.name}</h3>
        <p className="mt-1 text-sm text-[#736B66]">{tier.description}</p>
      </header>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-[#2D2825]">{tier.price}</span>
        {tier.priceSuffix && (
          <span className="text-sm text-[#736B66]">{tier.priceSuffix}</span>
        )}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-[#2D2825]">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#CC785C]/10">
              <Check className="h-3 w-3 text-[#CC785C]" aria-hidden="true" />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link href={tier.ctaHref} className="block">
          <Button
            className={cn(
              "w-full",
              isHighlighted
                ? "bg-[#CC785C] text-white hover:bg-[#B86548]"
                : "bg-white text-[#2D2825] border border-[#E8E0D5] hover:bg-[#F5F0E8] hover:text-[#CC785C]",
            )}
          >
            {tier.ctaLabel}
          </Button>
        </Link>
      </div>
    </article>
  );
}
