"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CustomerStatus } from "@prisma/client";
import { Pencil, Crown, CreditCard, Power, PowerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  suspendCustomer,
  activateCustomer,
  type CustomerDetail,
} from "@/server/actions/customers";
import { EditCustomerProfileDialog } from "@/components/merchant/EditCustomerProfileDialog";
import { UpdateTierDialog } from "@/components/merchant/UpdateTierDialog";
import { AdjustCreditDialog } from "@/components/merchant/AdjustCreditDialog";

interface CustomerDetailClientProps {
  customer: CustomerDetail;
}

export function CustomerDetailClient(
  props: CustomerDetailClientProps
): React.ReactElement {
  const { customer } = props;
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [tierOpen, setTierOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function handleToggleStatus() {
    setBusy(true);
    const res =
      customer.status === CustomerStatus.ACTIVE
        ? await suspendCustomer(customer.id)
        : await activateCustomer(customer.id);
    setBusy(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="mr-2 h-4 w-4 text-[#CC785C]" />
          Edit Profile
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
          onClick={() => setTierOpen(true)}
        >
          <Crown className="mr-2 h-4 w-4 text-[#D4A574]" />
          Edit Tier
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
          onClick={() => setCreditOpen(true)}
        >
          <CreditCard className="mr-2 h-4 w-4 text-[#CC785C]" />
          Adjust Credit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-[#E8E0D5] text-[#2D2825] hover:bg-white"
          onClick={handleToggleStatus}
          disabled={busy}
        >
          {customer.status === CustomerStatus.ACTIVE ? (
            <>
              <PowerOff className="mr-2 h-4 w-4 text-destructive" />
              Suspend
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4 text-[#D4A574]" />
              Activate
            </>
          )}
        </Button>
      </div>

      <EditCustomerProfileDialog
        customer={customer}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <UpdateTierDialog
        customer={customer}
        open={tierOpen}
        onOpenChange={setTierOpen}
      />
      <AdjustCreditDialog
        customer={customer}
        open={creditOpen}
        onOpenChange={setCreditOpen}
      />
    </>
  );
}
