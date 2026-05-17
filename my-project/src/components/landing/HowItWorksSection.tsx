import * as React from "react";
import { ClipboardList, Rocket, Settings2, type LucideIcon } from "lucide-react";

// Phase 19: How it works — แสดงขั้นตอนการเริ่มใช้งานเพียง 3 ขั้นตอน
interface Step {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Set up your catalog",
    description:
      "Import products and SKUs via CSV or sync from your existing ERP. Configure tier pricing, units, and tax rules.",
    icon: ClipboardList,
  },
  {
    number: "02",
    title: "Connect your team",
    description:
      "Invite buyers, merchants, and suppliers with role-based access. Approve new accounts with built-in workflows.",
    icon: Settings2,
  },
  {
    number: "03",
    title: "Start trading",
    description:
      "Receive orders, generate invoices, track shipments, and reconcile payments — all from one operational hub.",
    icon: Rocket,
  },
];

export function HowItWorksSection(): React.ReactElement {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="bg-[#F5F0E8] py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#CC785C]">
            How it works
          </p>
          <h2
            id="how-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-[#2D2825] sm:text-4xl"
          >
            Up and running in three simple steps
          </h2>
          <p className="mt-4 text-base text-[#736B66]">
            No long implementation projects. Most teams go live within a week.
          </p>
        </div>

        <ol
          aria-label="Onboarding steps"
          className="relative mt-14 grid gap-6 md:grid-cols-3"
        >
          {/* connector line on desktop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-[#D4A574] to-transparent md:block"
          />
          {STEPS.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </ol>
      </div>
    </section>
  );
}

interface StepCardProps {
  step: Step;
}

function StepCard({ step }: StepCardProps): React.ReactElement {
  const Icon = step.icon;
  return (
    <li className="relative flex flex-col items-start rounded-xl border border-[#E8E0D5] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#CC785C] text-white shadow-md ring-4 ring-[#F5F0E8]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#D4A574]">
          Step {step.number}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#2D2825]">{step.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#736B66]">
        {step.description}
      </p>
    </li>
  );
}
