"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Trash2, Loader2, ExternalLink } from "lucide-react";
import type { ShippingDocumentType } from "@prisma/client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createShippingDocument,
  deleteShippingDocument,
  type ShipmentDocumentItem,
} from "@/server/actions/shipments";

interface ShipmentDocumentsManagerProps {
  shipmentId: string;
  documents: ShipmentDocumentItem[];
}

const DOC_TYPES: { value: ShippingDocumentType; label: string }[] = [
  { value: "PACKING_SLIP", label: "Packing Slip" },
  { value: "SHIPPING_LABEL", label: "Shipping Label" },
  { value: "COMMERCIAL_INVOICE", label: "Commercial Invoice" },
  { value: "CUSTOMS_FORM", label: "Customs Form" },
  { value: "OTHER", label: "Other" },
];

export function ShipmentDocumentsManager({
  shipmentId,
  documents,
}: ShipmentDocumentsManagerProps): React.ReactElement {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<ShippingDocumentType>("PACKING_SLIP");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await createShippingDocument({
      shipmentId,
      type,
      fileUrl: fileUrl || null,
      notes: notes || null,
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setType("PACKING_SLIP");
    setFileUrl("");
    setNotes("");
    setAdding(false);
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    // ลบเอกสารโดย refresh หลังจากเสร็จ
    const res = await deleteShippingDocument(id, shipmentId);
    if (res.error) {
      setError(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <Card className="bg-white border-[#E8E0D5]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#2D2825] flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-[#CC785C]" />
          Documents
        </CardTitle>
        {!adding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdding(true)}
            className="border-[#E8E0D5] text-[#CC785C] hover:bg-[#F5F0E8] h-7 text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && (
          <form
            onSubmit={handleAdd}
            className="border border-[#E8E0D5] rounded-md p-3 space-y-3 bg-[#F5F0E8]/40"
          >
            <div className="space-y-1">
              <Label className="text-xs text-[#736B66]">Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ShippingDocumentType)}
              >
                <SelectTrigger className="border-[#E8E0D5] bg-white h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#736B66]">File URL (optional)</Label>
              <Input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
                className="border-[#E8E0D5] bg-white h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#736B66]">Notes</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border-[#E8E0D5] bg-white text-xs"
              />
            </div>
            {error && (
              <div className="text-xs text-destructive">{error}</div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                disabled={submitting}
                className="border-[#E8E0D5] text-[#2D2825] h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#CC785C] text-white hover:bg-[#B86548] h-7 text-xs"
              >
                {submitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        )}

        {documents.length === 0 ? (
          <div className="text-xs text-[#736B66] py-4 text-center">
            ยังไม่มีเอกสาร
          </div>
        ) : (
          <ul className="space-y-2">
            {documents.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 border border-[#E8E0D5] rounded-md p-2 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[#2D2825] font-medium text-xs">
                    {d.type.replace(/_/g, " ")}
                  </div>
                  <div className="text-[10px] text-[#736B66] font-mono">
                    {d.documentNumber}
                  </div>
                </div>
                {d.fileUrl && (
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#CC785C] hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(d.id)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
