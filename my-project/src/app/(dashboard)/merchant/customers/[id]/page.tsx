import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ShoppingCart,
  FileText,
  Star,
} from "lucide-react";
import {
  CustomerStatus,
  CustomerTier,
  InvoiceStatus,
  OrderStatus,
} from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomerById } from "@/server/actions/customers";
import { CustomerDetailClient } from "@/components/merchant/CustomerDetailClient";
import { AddContactDialog } from "@/components/merchant/AddContactDialog";

export const dynamic = "force-dynamic";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

function tierVariant(
  tier: CustomerTier
): "secondary" | "info" | "warning" | "vip" {
  switch (tier) {
    case CustomerTier.PLATINUM:
      return "vip";
    case CustomerTier.GOLD:
      return "warning";
    case CustomerTier.SILVER:
      return "info";
    default:
      return "secondary";
  }
}

function statusVariant(
  status: CustomerStatus
): "success" | "destructive" | "warning" {
  switch (status) {
    case CustomerStatus.ACTIVE:
      return "success";
    case CustomerStatus.SUSPENDED:
      return "destructive";
    default:
      return "warning";
  }
}

function orderStatusVariant(
  status: OrderStatus
): "success" | "destructive" | "warning" | "info" {
  switch (status) {
    case OrderStatus.DELIVERED:
      return "success";
    case OrderStatus.CANCELLED:
      return "destructive";
    case OrderStatus.PENDING:
      return "warning";
    default:
      return "info";
  }
}

function invoiceStatusVariant(
  status: InvoiceStatus
): "success" | "destructive" | "warning" | "info" | "secondary" {
  switch (status) {
    case InvoiceStatus.PAID:
      return "success";
    case InvoiceStatus.OVERDUE:
      return "destructive";
    case InvoiceStatus.CANCELLED:
      return "secondary";
    case InvoiceStatus.SENT:
      return "info";
    default:
      return "warning";
  }
}

function formatTHB(n: number): string {
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export default async function CustomerDetailPage(
  props: CustomerDetailPageProps
): Promise<React.ReactElement> {
  const { id } = await props.params;
  const res = await getCustomerById(id);

  if (res.error === "Customer not found.") {
    notFound();
  }

  if (!res.data) {
    return (
      <div className="flex-1 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
        <div className="rounded-md p-4 bg-destructive/10 text-destructive text-sm">
          {res.error ?? "Customer could not be loaded."}
        </div>
      </div>
    );
  }

  const c = res.data;
  const creditUtilization =
    c.creditLimit > 0
      ? Math.min(100, Math.round((c.creditUsed / c.creditLimit) * 100))
      : 0;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-[#F5F0E8] min-h-screen">
      <div className="flex items-center gap-2">
        <Link href="/merchant/customers">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#736B66] hover:text-[#2D2825] hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Customers
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-[#CC785C]" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#2D2825]">
              {c.companyName}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={tierVariant(c.accountTier)}>
                <Star className="h-3 w-3 mr-1" />
                {c.accountTier}
              </Badge>
              <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
              <span className="text-xs text-[#736B66]">
                {c.orderCount} orders · joined {formatDate(c.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <CustomerDetailClient customer={c} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-[#E8E0D5] md:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#2D2825]">Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-[#CC785C] mt-0.5" />
              <div>
                <div className="text-xs text-[#736B66]">Account User</div>
                <div className="text-[#2D2825]">{c.userName ?? "—"}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-[#CC785C] mt-0.5" />
              <div>
                <div className="text-xs text-[#736B66]">Email</div>
                <div className="text-[#2D2825]">{c.userEmail}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-[#CC785C] mt-0.5" />
              <div>
                <div className="text-xs text-[#736B66]">Tax ID</div>
                <div className="text-[#2D2825]">{c.taxId ?? "—"}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShoppingCart className="h-4 w-4 text-[#CC785C] mt-0.5" />
              <div>
                <div className="text-xs text-[#736B66]">Lifetime Spend</div>
                <div className="text-[#2D2825] font-semibold">
                  {formatTHB(c.totalSpend)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 md:col-span-2">
              <MapPin className="h-4 w-4 text-[#CC785C] mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-[#736B66]">Billing Address</div>
                <div className="text-[#2D2825] whitespace-pre-wrap">
                  {c.billingAddress ?? "—"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 md:col-span-2">
              <MapPin className="h-4 w-4 text-[#D4A574] mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-[#736B66]">Shipping Address</div>
                <div className="text-[#2D2825] whitespace-pre-wrap">
                  {c.shippingAddress ?? "—"}
                </div>
              </div>
            </div>
            {c.notes && (
              <div className="md:col-span-2 pt-3 border-t border-[#E8E0D5]">
                <div className="text-xs text-[#736B66] mb-1">Notes</div>
                <div className="text-[#2D2825] whitespace-pre-wrap">
                  {c.notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8E0D5]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2D2825]">
              <CreditCard className="h-5 w-5 text-[#CC785C]" />
              Credit Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#736B66]">Credit Limit</span>
              <span className="font-semibold text-[#2D2825]">
                {formatTHB(c.creditLimit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#736B66]">Credit Used</span>
              <span className="font-semibold text-[#CC785C]">
                {formatTHB(c.creditUsed)}
              </span>
            </div>
            <div className="flex justify-between border-t border-[#E8E0D5] pt-2">
              <span className="text-[#736B66]">Available</span>
              <span className="font-semibold text-[#2D2825]">
                {formatTHB(c.creditAvailable)}
              </span>
            </div>

            {/* Progress bar — แสดง utilization */}
            <div>
              <div className="flex justify-between text-xs text-[#736B66] mb-1">
                <span>Utilization</span>
                <span>{creditUtilization}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F5F0E8] overflow-hidden">
                <div
                  className="h-full bg-[#CC785C] transition-all"
                  style={{ width: `${creditUtilization}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#2D2825]">Contact Persons</CardTitle>
          <AddContactDialog customerId={c.id} />
        </CardHeader>
        <CardContent>
          {c.contacts.length === 0 ? (
            <div className="text-sm text-[#736B66] py-6 text-center">
              ยังไม่มีผู้ติดต่อ — เพิ่มผู้ติดต่อแรกเพื่อเริ่มจัดการ
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F0E8]">
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-center">Primary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.contacts.map((ct) => (
                  <TableRow key={ct.id}>
                    <TableCell className="font-medium text-[#2D2825]">
                      {ct.name}
                    </TableCell>
                    <TableCell className="text-sm text-[#736B66]">
                      {ct.role ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825]">
                      <span className="inline-flex items-center gap-1">
                        {ct.email && (
                          <Mail className="h-3 w-3 text-[#736B66]" />
                        )}
                        {ct.email ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825]">
                      <span className="inline-flex items-center gap-1">
                        {ct.phone && (
                          <Phone className="h-3 w-3 text-[#736B66]" />
                        )}
                        {ct.phone ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {ct.isPrimary ? (
                        <Badge variant="success">Primary</Badge>
                      ) : (
                        <span className="text-xs text-[#736B66]">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2D2825]">
            <ShoppingCart className="h-5 w-5 text-[#CC785C]" />
            Order History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {c.orders.length === 0 ? (
            <div className="text-sm text-[#736B66] py-6 text-center">
              ยังไม่มีประวัติการสั่งซื้อ
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F0E8]">
                  <TableHead>Order ID</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm">
                      <Link
                        href={`/merchant/orders/${o.id}`}
                        className="text-[#CC785C] hover:underline"
                      >
                        #{o.id.substring(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={orderStatusVariant(o.status)}>
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825]">
                      {formatDate(o.createdAt)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#CC785C]">
                      {formatTHB(o.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-[#E8E0D5]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2D2825]">
            <FileText className="h-5 w-5 text-[#D4A574]" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {c.invoices.length === 0 ? (
            <div className="text-sm text-[#736B66] py-6 text-center">
              ยังไม่มี invoice
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F0E8]">
                  <TableHead>Invoice #</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">
                      <Link
                        href={`/merchant/invoices/${inv.id}`}
                        className="text-[#CC785C] hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={invoiceStatusVariant(inv.status)}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825]">
                      {formatDate(inv.issuedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-[#2D2825]">
                      {formatDate(inv.dueDate)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#CC785C]">
                      {formatTHB(inv.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
