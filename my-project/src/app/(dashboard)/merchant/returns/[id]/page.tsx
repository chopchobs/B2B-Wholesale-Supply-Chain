import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getReturnById } from "@/server/actions/returns";
import { ReturnDetailClient } from "@/components/merchant/ReturnDetailClient";

export const dynamic = "force-dynamic";

interface ReturnDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReturnDetailPage({
  params,
}: ReturnDetailPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const res = await getReturnById(id);
  if (!res.data) {
    if (res.error === "Return request not found.") notFound();
  }
  const returnRequest = res.data;

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 lg:pt-6 bg-[#F5F0E8] min-h-screen w-full max-w-full overflow-x-hidden">
      <div className="flex items-center gap-2">
        <Link href="/merchant/returns">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Returns
          </Button>
        </Link>
      </div>

      {!returnRequest ? (
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {res.error ?? "Return request not found."}
        </div>
      ) : (
        <ReturnDetailClient returnRequest={returnRequest} />
      )}
    </div>
  );
}
