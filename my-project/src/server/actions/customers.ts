"use server";

import { prisma } from "@/lib/prisma";
import {
  Prisma,
  CustomerStatus,
  CustomerTier,
  OrderStatus,
  InvoiceStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface CustomerListItem {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  companyName: string;
  taxId: string | null;
  accountTier: CustomerTier;
  status: CustomerStatus;
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  orderCount: number;
  totalSpend: number;
  createdAt: Date;
}

export interface CustomerContactItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
}

export interface CustomerOrderItem {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
}

export interface CustomerInvoiceItem {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  total: number;
  dueDate: Date;
  issuedAt: Date;
}

export interface CustomerDetail extends CustomerListItem {
  billingAddress: string | null;
  shippingAddress: string | null;
  notes: string | null;
  contacts: CustomerContactItem[];
  orders: CustomerOrderItem[];
  invoices: CustomerInvoiceItem[];
}

export interface CustomerSummary {
  totalCustomers: number;
  activeCustomers: number;
  suspendedCustomers: number;
  totalCreditOutstanding: number;
}

export interface CustomerFilter {
  tier?: CustomerTier | "ALL";
  status?: CustomerStatus | "ALL";
  search?: string;
}

export interface CreateCustomerProfileInput {
  companyName: string;
  taxId?: string | null;
  creditLimit?: number;
  accountTier?: CustomerTier;
  status?: CustomerStatus;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerProfileInput {
  companyName?: string;
  taxId?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  notes?: string | null;
}

export interface CreateContactInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isPrimary?: boolean;
}

// --- Helpers ---

function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

// --- Queries ---

export async function getCustomers(
  filter?: CustomerFilter
): Promise<ActionResult<CustomerListItem[]>> {
  try {
    const where: Prisma.CustomerProfileWhereInput = {};
    if (filter?.tier && filter.tier !== "ALL") {
      where.accountTier = filter.tier;
    }
    if (filter?.status && filter.status !== "ALL") {
      where.status = filter.status;
    }
    if (filter?.search) {
      where.OR = [
        { companyName: { contains: filter.search, mode: "insensitive" } },
        { taxId: { contains: filter.search, mode: "insensitive" } },
        { user: { email: { contains: filter.search, mode: "insensitive" } } },
        { user: { name: { contains: filter.search, mode: "insensitive" } } },
      ];
    }

    const profiles = await prisma.customerProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // ดึง order aggregate ของ user แต่ละคน
    const userIds = profiles.map((p) => p.userId);
    const orderAggregates =
      userIds.length === 0
        ? []
        : await prisma.order.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
            _count: { _all: true },
            _sum: { totalAmount: true },
          });

    const aggMap = new Map(
      orderAggregates.map((a) => [
        a.userId,
        {
          count: a._count._all,
          total: dec(a._sum.totalAmount),
        },
      ])
    );

    const data: CustomerListItem[] = profiles.map((p) => {
      const agg = aggMap.get(p.userId);
      const creditLimit = dec(p.creditLimit);
      const creditUsed = dec(p.creditUsed);
      return {
        id: p.id,
        userId: p.userId,
        userName: p.user.name,
        userEmail: p.user.email,
        companyName: p.companyName,
        taxId: p.taxId,
        accountTier: p.accountTier,
        status: p.status,
        creditLimit,
        creditUsed,
        creditAvailable: Math.max(0, creditLimit - creditUsed),
        orderCount: agg?.count ?? 0,
        totalSpend: agg?.total ?? 0,
        createdAt: p.createdAt,
      };
    });

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getCustomers failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load customers.";
    return { data: null, error: message };
  }
}

export async function getCustomerById(
  id: string
): Promise<ActionResult<CustomerDetail>> {
  try {
    const profile = await prisma.customerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      },
    });

    if (!profile) {
      return { data: null, error: "Customer not found." };
    }

    // ดึง order ของ user นี้ + invoices (ผ่าน order)
    const orders = await prisma.order.findMany({
      where: { userId: profile.userId },
      orderBy: { createdAt: "desc" },
      include: {
        invoice: true,
      },
    });

    const orderList: CustomerOrderItem[] = orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalAmount: dec(o.totalAmount),
      createdAt: o.createdAt,
    }));

    const invoiceList: CustomerInvoiceItem[] = orders
      .filter((o) => o.invoice !== null)
      .map((o) => {
        const inv = o.invoice!;
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          total: dec(inv.total),
          dueDate: inv.dueDate,
          issuedAt: inv.issuedAt,
        };
      });

    const totalSpend = orders.reduce((sum, o) => sum + dec(o.totalAmount), 0);
    const creditLimit = dec(profile.creditLimit);
    const creditUsed = dec(profile.creditUsed);

    const detail: CustomerDetail = {
      id: profile.id,
      userId: profile.userId,
      userName: profile.user.name,
      userEmail: profile.user.email,
      companyName: profile.companyName,
      taxId: profile.taxId,
      accountTier: profile.accountTier,
      status: profile.status,
      creditLimit,
      creditUsed,
      creditAvailable: Math.max(0, creditLimit - creditUsed),
      orderCount: orders.length,
      totalSpend,
      createdAt: profile.createdAt,
      billingAddress: profile.billingAddress,
      shippingAddress: profile.shippingAddress,
      notes: profile.notes,
      contacts: profile.contacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: c.role,
        isPrimary: c.isPrimary,
      })),
      orders: orderList,
      invoices: invoiceList,
    };

    return { data: detail, error: null };
  } catch (error: unknown) {
    console.error("getCustomerById failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load customer.";
    return { data: null, error: message };
  }
}

export async function createCustomerProfile(
  userId: string,
  input: CreateCustomerProfileInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.companyName || input.companyName.trim().length === 0) {
      return { data: null, error: "Company name is required." };
    }

    // ตรวจสอบ user มีอยู่และยังไม่มี profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true },
    });
    if (!user) {
      return { data: null, error: "User not found." };
    }
    if (user.customerProfile) {
      return { data: null, error: "User already has a customer profile." };
    }

    const created = await prisma.customerProfile.create({
      data: {
        userId,
        companyName: input.companyName.trim(),
        taxId: input.taxId?.trim() || null,
        creditLimit: input.creditLimit ?? 0,
        accountTier: input.accountTier ?? CustomerTier.BRONZE,
        status: input.status ?? CustomerStatus.PENDING,
        billingAddress: input.billingAddress?.trim() || null,
        shippingAddress: input.shippingAddress?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });

    revalidatePath("/merchant/customers");
    revalidatePath("/merchant");

    return { data: { id: created.id }, error: null };
  } catch (error: unknown) {
    console.error("createCustomerProfile failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create customer profile.";
    return { data: null, error: message };
  }
}

export async function updateCustomerProfile(
  id: string,
  input: UpdateCustomerProfileInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const data: Prisma.CustomerProfileUpdateInput = {};
    if (input.companyName !== undefined)
      data.companyName = input.companyName.trim();
    if (input.taxId !== undefined) data.taxId = input.taxId?.trim() || null;
    if (input.billingAddress !== undefined)
      data.billingAddress = input.billingAddress?.trim() || null;
    if (input.shippingAddress !== undefined)
      data.shippingAddress = input.shippingAddress?.trim() || null;
    if (input.notes !== undefined) data.notes = input.notes?.trim() || null;

    const updated = await prisma.customerProfile.update({
      where: { id },
      data,
    });

    revalidatePath("/merchant/customers");
    revalidatePath(`/merchant/customers/${id}`);

    return { data: { id: updated.id }, error: null };
  } catch (error: unknown) {
    console.error("updateCustomerProfile failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update customer profile.";
    return { data: null, error: message };
  }
}

export async function updateAccountTier(
  id: string,
  tier: CustomerTier
): Promise<ActionResult<{ id: string }>> {
  try {
    const updated = await prisma.customerProfile.update({
      where: { id },
      data: { accountTier: tier },
    });
    revalidatePath("/merchant/customers");
    revalidatePath(`/merchant/customers/${id}`);
    return { data: { id: updated.id }, error: null };
  } catch (error: unknown) {
    console.error("updateAccountTier failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update tier.";
    return { data: null, error: message };
  }
}

export async function updateCreditLimit(
  id: string,
  creditLimit: number
): Promise<ActionResult<{ id: string }>> {
  try {
    if (creditLimit < 0) {
      return { data: null, error: "Credit limit must be 0 or greater." };
    }
    const updated = await prisma.customerProfile.update({
      where: { id },
      data: { creditLimit: new Prisma.Decimal(creditLimit) },
    });
    revalidatePath("/merchant/customers");
    revalidatePath(`/merchant/customers/${id}`);
    revalidatePath("/merchant");
    return { data: { id: updated.id }, error: null };
  } catch (error: unknown) {
    console.error("updateCreditLimit failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update credit limit.";
    return { data: null, error: message };
  }
}

export async function suspendCustomer(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const updated = await prisma.customerProfile.update({
      where: { id },
      data: { status: CustomerStatus.SUSPENDED },
    });
    revalidatePath("/merchant/customers");
    revalidatePath(`/merchant/customers/${id}`);
    revalidatePath("/merchant");
    return { data: { id: updated.id }, error: null };
  } catch (error: unknown) {
    console.error("suspendCustomer failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to suspend customer.";
    return { data: null, error: message };
  }
}

export async function activateCustomer(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const updated = await prisma.customerProfile.update({
      where: { id },
      data: { status: CustomerStatus.ACTIVE },
    });
    revalidatePath("/merchant/customers");
    revalidatePath(`/merchant/customers/${id}`);
    revalidatePath("/merchant");
    return { data: { id: updated.id }, error: null };
  } catch (error: unknown) {
    console.error("activateCustomer failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to activate customer.";
    return { data: null, error: message };
  }
}

export async function addCustomerContact(
  customerId: string,
  input: CreateContactInput
): Promise<ActionResult<CustomerContactItem>> {
  try {
    if (!input.name || input.name.trim().length === 0) {
      return { data: null, error: "Contact name is required." };
    }

    // ถ้า set isPrimary = true ต้อง unset primary คนอื่นก่อน
    if (input.isPrimary) {
      await prisma.customerContact.updateMany({
        where: { customerId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const created = await prisma.customerContact.create({
      data: {
        customerId,
        name: input.name.trim(),
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        role: input.role?.trim() || null,
        isPrimary: input.isPrimary ?? false,
      },
    });

    revalidatePath(`/merchant/customers/${customerId}`);

    return {
      data: {
        id: created.id,
        name: created.name,
        email: created.email,
        phone: created.phone,
        role: created.role,
        isPrimary: created.isPrimary,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("addCustomerContact failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to add contact.";
    return { data: null, error: message };
  }
}

export async function getCustomerSummary(): Promise<
  ActionResult<CustomerSummary>
> {
  try {
    const [totalCustomers, activeCustomers, suspendedCustomers, creditAgg] =
      await Promise.all([
        prisma.customerProfile.count(),
        prisma.customerProfile.count({
          where: { status: CustomerStatus.ACTIVE },
        }),
        prisma.customerProfile.count({
          where: { status: CustomerStatus.SUSPENDED },
        }),
        prisma.customerProfile.aggregate({
          _sum: { creditUsed: true },
        }),
      ]);

    return {
      data: {
        totalCustomers,
        activeCustomers,
        suspendedCustomers,
        totalCreditOutstanding: dec(creditAgg._sum.creditUsed),
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("getCustomerSummary failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load customer summary.";
    return { data: null, error: message };
  }
}

// helper เผื่อใช้ในหน้าอื่น (เช่น dialog เพิ่ม profile)
export async function getUsersWithoutCustomerProfile(): Promise<
  ActionResult<Array<{ id: string; name: string | null; email: string }>>
> {
  try {
    const users = await prisma.user.findMany({
      where: { customerProfile: null, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { data: users, error: null };
  } catch (error: unknown) {
    console.error("getUsersWithoutCustomerProfile failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load users.";
    return { data: null, error: message };
  }
}
