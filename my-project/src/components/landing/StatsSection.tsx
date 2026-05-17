import * as React from "react";

// Phase 19: Stats section — social proof แบบสั้น
interface Stat {
  value: string;
  label: string;
  helper: string;
}

const STATS: Stat[] = [
  { value: "2,400+", label: "Active merchants", helper: "Across 18 countries" },
  { value: "฿8.6B", label: "Order volume processed", helper: "In the last 12 months" },
  { value: "99.98%", label: "Platform uptime", helper: "Backed by enterprise SLA" },
  { value: "<200ms", label: "Average API response", helper: "Globally distributed" },
];

export function StatsSection(): React.ReactElement {
  return (
    <section
      aria-labelledby="stats-heading"
      className="bg-white py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="stats-heading" className="sr-only">
          Platform metrics
        </h2>
        <div className="rounded-2xl border border-[#E8E0D5] bg-gradient-to-br from-[#F5F0E8] via-white to-[#FBF8F3] px-6 py-10 sm:px-10 sm:py-12">
          <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-4xl font-bold tracking-tight text-[#CC785C] sm:text-5xl">
                  {stat.value}
                </dd>
                <p className="mt-2 text-sm font-semibold text-[#2D2825]">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-xs text-[#736B66]">{stat.helper}</p>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
