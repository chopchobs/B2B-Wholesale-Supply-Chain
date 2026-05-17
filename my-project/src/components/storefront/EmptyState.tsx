import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  children,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E8E0D5] bg-white px-6 py-16 text-center">
      {Icon ? (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F0E8] text-[#CC785C]">
          <Icon className="h-8 w-8" />
        </div>
      ) : null}
      <h3 className="text-xl font-semibold text-[#2D2825]">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-[#736B66]">{description}</p>
      ) : null}
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} className="mt-6 inline-block">
          <Button className="bg-[#CC785C] text-white hover:bg-[#B86548]">
            {ctaLabel}
          </Button>
        </Link>
      ) : null}
      {children}
    </div>
  );
}
