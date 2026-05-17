"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Phase 19: เมนูสำหรับ public landing page
interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Testimonials" },
];

export function LandingNav(): React.ReactElement {
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false);
  const [scrolled, setScrolled] = React.useState<boolean>(false);

  // เปลี่ยน style ของ nav เมื่อมีการ scroll ลงไป
  React.useEffect(() => {
    function handleScroll(): void {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function closeMobile(): void {
    setMobileOpen(false);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-[#F5F0E8]/85 backdrop-blur border-b border-[#E8E0D5]"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="B2B Wholesale home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#CC785C] text-white shadow-sm">
            <Package className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[#2D2825]">B2B Wholesale</p>
            <p className="text-[10px] uppercase tracking-wider text-[#736B66]">
              Supply Chain Suite
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden lg:flex items-center gap-1"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-[#2D2825] transition-colors hover:bg-[#FFFFFF] hover:text-[#CC785C]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-[#2D2825] hover:bg-white hover:text-[#CC785C]"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-[#CC785C] text-white shadow-sm hover:bg-[#B86548]">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E8E0D5] bg-white text-[#2D2825] transition-colors hover:bg-[#F5F0E8]"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E8E0D5] bg-white">
          <nav
            className="flex flex-col gap-1 px-4 py-4"
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className="rounded-md px-3 py-2 text-sm font-medium text-[#2D2825] transition-colors hover:bg-[#F5F0E8] hover:text-[#CC785C]"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E8E0D5] pt-3">
              <Link href="/login" onClick={closeMobile}>
                <Button
                  variant="outline"
                  className="w-full border-[#E8E0D5] bg-white text-[#2D2825] hover:bg-[#F5F0E8]"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register" onClick={closeMobile}>
                <Button className="w-full bg-[#CC785C] text-white hover:bg-[#B86548]">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
