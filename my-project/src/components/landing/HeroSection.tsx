import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Phase 19: Hero section — เน้น headline, subheadline และ CTA หลักของระบบ
interface HeroBullet {
  label: string;
}

const HERO_BULLETS: HeroBullet[] = [
  { label: "Real-time inventory across warehouses" },
  { label: "Automated PO & invoice workflow" },
  { label: "Multi-vendor & multi-tier pricing" },
];

export function HeroSection(): React.ReactElement {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden"
    >
      {/* Decorative gradient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-[#D4A574]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#CC785C]/15 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-28">
        {/* Copy */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E8E0D5] bg-white px-3 py-1 text-xs font-medium text-[#2D2825] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#D4A574]" aria-hidden="true" />
            <span>Built for modern B2B wholesale teams</span>
          </div>

          <h1
            id="hero-heading"
            className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-[#2D2825] sm:text-5xl lg:text-6xl"
          >
            Run your wholesale business
            <br className="hidden sm:block" />{" "}
            <span className="text-[#CC785C]">on one platform.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#736B66]">
            Streamline ordering, manage suppliers, and keep inventory in sync —
            from procurement to delivery. A complete supply chain command center
            for retailers, distributors and wholesale merchants.
          </p>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2" aria-label="Key features">
            {HERO_BULLETS.map((bullet) => (
              <li
                key={bullet.label}
                className="flex items-start gap-2 text-sm text-[#2D2825]"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#CC785C]"
                  aria-hidden="true"
                />
                <span>{bullet.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#CC785C] px-6 text-white shadow-sm hover:bg-[#B86548]"
              >
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="#contact" className="sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-[#E8E0D5] bg-white px-6 text-[#2D2825] hover:bg-[#F5F0E8] hover:text-[#CC785C]"
              >
                Request Demo
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-[#736B66]">
            No credit card required · 14-day free trial · Cancel anytime
          </p>
        </div>

        {/* Visual mock-card */}
        <div className="lg:col-span-5 flex items-center">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

// Visual ฝั่งขวา — mock dashboard preview ใช้ pure SVG/CSS ไม่ต้องใช้รูป
function HeroVisual(): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className="relative w-full"
    >
      {/* Main card */}
      <div className="relative rounded-2xl border border-[#E8E0D5] bg-white p-5 shadow-xl shadow-[#CC785C]/10">
        <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#CC785C]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#D4A574]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E8E0D5]" />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#736B66]">
            Live Dashboard
          </span>
        </div>

        {/* KPI tiles */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            { label: "Revenue", value: "฿2.4M", tone: "text-[#CC785C]" },
            { label: "Orders", value: "1,284", tone: "text-[#2D2825]" },
            { label: "SKUs", value: "5,612", tone: "text-[#2D2825]" },
          ].map((tile) => (
            <div
              key={tile.label}
              className="rounded-lg border border-[#E8E0D5] bg-[#F5F0E8] p-3"
            >
              <p className="text-[10px] uppercase tracking-wider text-[#736B66]">
                {tile.label}
              </p>
              <p className={`mt-1 text-lg font-bold ${tile.tone}`}>{tile.value}</p>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="mt-4 rounded-lg border border-[#E8E0D5] bg-[#FBF8F3] p-4">
          <div className="flex items-end gap-2 h-28">
            {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-[#CC785C] to-[#D4A574]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[9px] text-[#736B66]">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span>
            <span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Recent row */}
        <div className="mt-4 space-y-2">
          {[
            { name: "Acme Trading Co.", amount: "฿48,200", status: "Paid" },
            { name: "Northern Retail Hub", amount: "฿12,450", status: "Shipped" },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between rounded-md border border-[#E8E0D5] bg-white px-3 py-2"
            >
              <div>
                <p className="text-xs font-semibold text-[#2D2825]">{row.name}</p>
                <p className="text-[10px] text-[#736B66]">{row.status}</p>
              </div>
              <p className="text-xs font-bold text-[#CC785C]">{row.amount}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Floating chip */}
      <div className="absolute -left-4 -bottom-4 hidden rounded-xl border border-[#E8E0D5] bg-white px-4 py-3 shadow-lg sm:block">
        <p className="text-[10px] uppercase tracking-wider text-[#736B66]">Uptime</p>
        <p className="text-lg font-bold text-[#2D2825]">
          99.98<span className="text-[#CC785C]">%</span>
        </p>
      </div>
      <div className="absolute -right-3 -top-3 hidden rounded-xl border border-[#E8E0D5] bg-white px-3 py-2 shadow-lg sm:block">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#CC785C]" />
          <span className="text-[10px] font-semibold text-[#2D2825]">Sync active</span>
        </div>
      </div>
    </div>
  );
}
