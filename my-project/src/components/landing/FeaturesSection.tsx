import * as React from "react";
import {
  Boxes,
  FileSpreadsheet,
  Network,
  ShieldCheck,
  Truck,
  Workflow,
  type LucideIcon,
} from "lucide-react";

// Phase 19: Features section — แสดง value proposition หลัก 6 ข้อ
interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FEATURES: Feature[] = [
  {
    title: "Smart Inventory",
    description:
      "Track stock across multiple warehouses with real-time syncing, low-stock alerts, and reorder suggestions.",
    icon: Boxes,
  },
  {
    title: "Streamlined Ordering",
    description:
      "Convert quotes to orders to invoices in a few clicks. Bulk uploads, recurring orders, and tiered pricing built-in.",
    icon: Workflow,
  },
  {
    title: "Supplier Network",
    description:
      "Manage purchase orders, lead times, and supplier performance from a single connected dashboard.",
    icon: Network,
  },
  {
    title: "Shipping & Logistics",
    description:
      "Configure carriers, shipping zones, and dynamic rates. Generate labels and track deliveries end-to-end.",
    icon: Truck,
  },
  {
    title: "Invoices & Credit",
    description:
      "Automate invoicing, payment terms, and customer credit limits with overdue alerts and reconciliation.",
    icon: FileSpreadsheet,
  },
  {
    title: "Enterprise Security",
    description:
      "Role-based access, audit logs, and SOC-friendly controls keep your wholesale data secure by default.",
    icon: ShieldCheck,
  },
];

export function FeaturesSection(): React.ReactElement {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="border-y border-[#E8E0D5] bg-white py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#CC785C]">
            Why teams choose us
          </p>
          <h2
            id="features-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-[#2D2825] sm:text-4xl"
          >
            Everything you need to run wholesale at scale
          </h2>
          <p className="mt-4 text-base text-[#736B66]">
            One unified workspace for inventory, orders, suppliers, and finance —
            so your team can stop juggling spreadsheets and start shipping.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  feature: Feature;
}

function FeatureCard({ feature }: FeatureCardProps): React.ReactElement {
  const Icon = feature.icon;
  return (
    <article className="group relative flex flex-col gap-3 rounded-xl border border-[#E8E0D5] bg-[#FBF8F3] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CC785C]/40 hover:bg-white hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#CC785C]/10 text-[#CC785C] transition-colors group-hover:bg-[#CC785C] group-hover:text-white">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[#2D2825]">{feature.title}</h3>
      <p className="text-sm leading-relaxed text-[#736B66]">
        {feature.description}
      </p>
    </article>
  );
}
