import * as React from "react";
import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

// Phase 19: Public-facing landing page สำหรับ B2B Wholesale & Supply Chain platform
export const metadata: Metadata = {
  title: "B2B Wholesale — Supply Chain Suite for Modern Merchants",
  description:
    "Streamline ordering, manage suppliers, and keep inventory in sync. The all-in-one B2B wholesale and supply chain platform for distributors, retailers, and merchants.",
};

export default function HomePage(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F0E8] text-[#2D2825]">
      <LandingNav />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
