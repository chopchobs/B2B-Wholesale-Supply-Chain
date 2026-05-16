"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Power } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createShippingZone,
  deleteShippingZone,
  updateShippingZone,
  type ShippingZoneListItem,
} from "@/server/actions/shippingRates";
import {
  createShippingRate,
  deleteShippingRate,
  updateShippingRate,
  type ShippingRateListItem,
} from "@/server/actions/shippingRates";

interface CarrierOption {
  id: string;
  name: string;
  code: string;
}

interface RatesZonesClientProps {
  rates: ShippingRateListItem[];
  zones: ShippingZoneListItem[];
  carriers: CarrierOption[];
}

export function RatesZonesClient({
  rates,
  zones,
  carriers,
}: RatesZonesClientProps): React.ReactElement {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Zone form state
  const [zoneName, setZoneName] = useState("");
  const [zoneRegions, setZoneRegions] = useState("");
  const [zoneDesc, setZoneDesc] = useState("");
  const [zoneSubmit, setZoneSubmit] = useState(false);

  // Rate form state
  const [rCarrier, setRCarrier] = useState("");
  const [rZone, setRZone] = useState("");
  const [rService, setRService] = useState("");
  const [rBase, setRBase] = useState("0");
  const [rPerKg, setRPerKg] = useState("0");
  const [rMinWeight, setRMinWeight] = useState("0");
  const [rDays, setRDays] = useState("");
  const [rateSubmit, setRateSubmit] = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleAddZone(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!zoneName.trim()) {
      setError("Zone name required.");
      return;
    }
    setZoneSubmit(true);
    // แปลง regions text เป็น array (รองรับ comma หรือ newline)
    const regions = zoneRegions
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await createShippingZone({
      name: zoneName.trim(),
      regions: regions.length > 0 ? regions : null,
      description: zoneDesc || null,
    });
    setZoneSubmit(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setZoneName("");
    setZoneRegions("");
    setZoneDesc("");
    refresh();
  }

  async function handleDeleteZone(id: string) {
    setBusyId(id);
    setError(null);
    const res = await deleteShippingZone(id);
    setBusyId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    refresh();
  }

  async function handleToggleZone(id: string, isActive: boolean) {
    setBusyId(id);
    const res = await updateShippingZone(id, { isActive: !isActive });
    setBusyId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    refresh();
  }

  async function handleAddRate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!rCarrier || !rZone || !rService.trim()) {
      setError("กรอก carrier, zone, service ให้ครบ");
      return;
    }
    setRateSubmit(true);
    const res = await createShippingRate({
      carrierId: rCarrier,
      zoneId: rZone,
      serviceName: rService.trim(),
      baseRate: Number(rBase) || 0,
      perKgRate: Number(rPerKg) || 0,
      minWeightKg: Number(rMinWeight) || 0,
      estimatedDays: rDays ? Number(rDays) : null,
    });
    setRateSubmit(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setRCarrier("");
    setRZone("");
    setRService("");
    setRBase("0");
    setRPerKg("0");
    setRMinWeight("0");
    setRDays("");
    refresh();
  }

  async function handleDeleteRate(id: string) {
    setBusyId(id);
    const res = await deleteShippingRate(id);
    setBusyId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    refresh();
  }

  async function handleToggleRate(id: string, isActive: boolean) {
    setBusyId(id);
    const res = await updateShippingRate(id, { isActive: !isActive });
    setBusyId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md p-3 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <Tabs defaultValue="rates">
        <TabsList className="bg-white border border-[#E8E0D5]">
          <TabsTrigger value="rates">Rates ({rates.length})</TabsTrigger>
          <TabsTrigger value="zones">Zones ({zones.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="rates" className="space-y-4 mt-4">
          <Card className="bg-white border-[#E8E0D5]">
            <CardHeader>
              <CardTitle className="text-[#2D2825] text-base">
                Add Shipping Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {carriers.length === 0 || zones.length === 0 ? (
                <div className="text-sm text-[#736B66] py-2">
                  ต้องมี carrier และ zone อย่างน้อย 1 รายการก่อนสร้างเรท
                </div>
              ) : (
                <form
                  onSubmit={handleAddRate}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3"
                >
                  <div className="space-y-1">
                    <Label className="text-xs text-[#736B66]">Carrier</Label>
                    <Select value={rCarrier} onValueChange={setRCarrier}>
                      <SelectTrigger className="border-[#E8E0D5] h-9">
                        <SelectValue placeholder="Carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        {carriers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-[#736B66]">Zone</Label>
                    <Select value={rZone} onValueChange={setRZone}>
                      <SelectTrigger className="border-[#E8E0D5] h-9">
                        <SelectValue placeholder="Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((z) => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-[#736B66]">Service</Label>
                    <Input
                      value={rService}
                      onChange={(e) => setRService(e.target.value)}
                      placeholder="Standard"
                      className="border-[#E8E0D5] h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-[#736B66]">
                      Base Rate (฿)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={rBase}
                      onChange={(e) => setRBase(e.target.value)}
                      className="border-[#E8E0D5] h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-[#736B66]">Per kg (฿)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={rPerKg}
                      onChange={(e) => setRPerKg(e.target.value)}
                      className="border-[#E8E0D5] h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-[#736B66]">
                      Min Weight (kg)
                    </Label>
                    <Input
                      type="number"
                      step="0.001"
                      min={0}
                      value={rMinWeight}
                      onChange={(e) => setRMinWeight(e.target.value)}
                      className="border-[#E8E0D5] h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-[#736B66]">
                      Est. Days
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={rDays}
                      onChange={(e) => setRDays(e.target.value)}
                      placeholder="3"
                      className="border-[#E8E0D5] h-9"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={rateSubmit}
                      className="bg-[#CC785C] text-white hover:bg-[#B86548] h-9 w-full"
                    >
                      {rateSubmit ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Rate
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-[#E8E0D5]">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F5F0E8] hover:bg-[#F5F0E8]">
                    <TableHead className="text-[#736B66]">Carrier</TableHead>
                    <TableHead className="text-[#736B66]">Zone</TableHead>
                    <TableHead className="text-[#736B66]">Service</TableHead>
                    <TableHead className="text-right text-[#736B66]">
                      Base
                    </TableHead>
                    <TableHead className="text-right text-[#736B66]">
                      Per kg
                    </TableHead>
                    <TableHead className="text-right text-[#736B66]">
                      Min Wt
                    </TableHead>
                    <TableHead className="text-[#736B66]">Days</TableHead>
                    <TableHead className="text-[#736B66]">Status</TableHead>
                    <TableHead className="text-right text-[#736B66]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-[#736B66] text-sm"
                      >
                        ยังไม่มี shipping rate
                      </TableCell>
                    </TableRow>
                  ) : (
                    rates.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-[#2D2825]">
                          {r.carrierName}
                        </TableCell>
                        <TableCell className="text-[#2D2825]">
                          {r.zoneName}
                        </TableCell>
                        <TableCell className="text-[#2D2825]">
                          {r.serviceName}
                        </TableCell>
                        <TableCell className="text-right text-[#2D2825]">
                          ฿{r.baseRate.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-[#2D2825]">
                          ฿{r.perKgRate.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-[#736B66]">
                          {r.minWeightKg} kg
                        </TableCell>
                        <TableCell className="text-[#736B66]">
                          {r.estimatedDays ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={r.isActive ? "success" : "default"}
                          >
                            {r.isActive ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busyId === r.id}
                              onClick={() => handleToggleRate(r.id, r.isActive)}
                              className="h-7 w-7 p-0"
                            >
                              <Power className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busyId === r.id}
                              onClick={() => handleDeleteRate(r.id)}
                              className="h-7 w-7 p-0 text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4 mt-4">
          <Card className="bg-white border-[#E8E0D5]">
            <CardHeader>
              <CardTitle className="text-[#2D2825] text-base">
                Add Shipping Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddZone} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#736B66]">Zone Name</Label>
                    <Input
                      value={zoneName}
                      onChange={(e) => setZoneName(e.target.value)}
                      placeholder="Bangkok Metro"
                      className="border-[#E8E0D5]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-[#736B66]">
                      Regions (comma or newline)
                    </Label>
                    <Input
                      value={zoneRegions}
                      onChange={(e) => setZoneRegions(e.target.value)}
                      placeholder="Bangkok, Nonthaburi, Pathum Thani"
                      className="border-[#E8E0D5]"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-[#736B66]">Description</Label>
                  <Textarea
                    rows={2}
                    value={zoneDesc}
                    onChange={(e) => setZoneDesc(e.target.value)}
                    className="border-[#E8E0D5]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={zoneSubmit}
                  className="bg-[#CC785C] text-white hover:bg-[#B86548]"
                >
                  {zoneSubmit ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Zone
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#E8E0D5]">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F5F0E8] hover:bg-[#F5F0E8]">
                    <TableHead className="text-[#736B66]">Zone Name</TableHead>
                    <TableHead className="text-[#736B66]">Regions</TableHead>
                    <TableHead className="text-[#736B66]">Rates</TableHead>
                    <TableHead className="text-[#736B66]">Status</TableHead>
                    <TableHead className="text-right text-[#736B66]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-[#736B66] text-sm"
                      >
                        ยังไม่มี shipping zone
                      </TableCell>
                    </TableRow>
                  ) : (
                    zones.map((z) => (
                      <TableRow key={z.id}>
                        <TableCell className="text-[#2D2825] font-medium">
                          {z.name}
                        </TableCell>
                        <TableCell className="text-xs text-[#736B66] max-w-md truncate">
                          {Array.isArray(z.regions)
                            ? (z.regions as string[]).join(", ")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-[#2D2825]">
                          {z.rateCount}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={z.isActive ? "success" : "default"}
                          >
                            {z.isActive ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busyId === z.id}
                              onClick={() => handleToggleZone(z.id, z.isActive)}
                              className="h-7 w-7 p-0"
                            >
                              <Power className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busyId === z.id}
                              onClick={() => handleDeleteZone(z.id)}
                              className="h-7 w-7 p-0 text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
