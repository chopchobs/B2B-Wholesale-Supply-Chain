import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Phase 19: CTA banner ก่อนปิดท้ายหน้า
export function CTASection(): React.ReactElement {
  return (
    <section
      id="contact"
      aria-labelledby="cta-heading"
      className="bg-[#F5F0E8] py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#E8E0D5] bg-gradient-to-br from-[#2D2825] via-[#3a302a] to-[#2D2825] px-6 py-14 text-center shadow-xl sm:px-12 sm:py-20">
          {/* Decorative accents */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-[#CC785C]/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-[#D4A574]/20 blur-3xl"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2
              id="cta-heading"
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              Ready to modernize your wholesale operation?
            </h2>
            <p className="mt-4 text-base text-white/75">
              Join thousands of merchants who have simplified ordering,
              inventory, and fulfillment with one platform. Get started in
              minutes — no credit card needed.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="sm:w-auto w-full">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#CC785C] px-6 text-white shadow-md hover:bg-[#B86548]"
                >
                  Start free trial
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="#contact" className="sm:w-auto w-full">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  Request Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
