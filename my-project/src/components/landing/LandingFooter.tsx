import * as React from "react";
import Link from "next/link";
import { Package } from "lucide-react";

// Phase 19: Footer สำหรับ public landing page
interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

const FOOTER_COLS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "Storefront", href: "/storefront" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#contact" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API reference", href: "#" },
      { label: "Status", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
];

export function LandingFooter(): React.ReactElement {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#E8E0D5] bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand block */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#CC785C] text-white shadow-sm">
                <Package className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-[#2D2825]">
                  B2B Wholesale
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[#736B66]">
                  Supply Chain Suite
                </p>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-[#736B66]">
              The all-in-one operational platform for modern wholesale merchants,
              distributors, and retailers.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#2D2825]">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#736B66] transition-colors hover:text-[#CC785C]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#E8E0D5] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#736B66]">
            © {year} B2B Wholesale. All rights reserved.
          </p>
          <p className="text-xs text-[#736B66]">
            Made with care · Crafted for supply chain teams
          </p>
        </div>
      </div>
    </footer>
  );
}
