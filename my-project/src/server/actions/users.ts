"use server";

import { prisma } from "@/lib/prisma";
import {
  Prisma,
  Role,
  ApprovalStatus,
  OrderStatus,
  CustomerStatus,
  CustomerTier,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Types ---

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface UserListItem {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  hasCustomerProfile: boolean;
  customerCompany: string | null;
  customerStatus: CustomerStatus | null;
  customerTier: CustomerTier | null;
  latestApprovalStatus: ApprovalStatus | null;
  orderCount: number;
  createdAt: Date;
}

export interface UserApprovalItem {
  id: string;
  status: ApprovalStatus;
  reviewedBy: string | null;
  reviewerName: string | null;
  reviewedAt: Date | null;
  note: string | null;
  createdAt: Date;
}

export interface UserOrderSummaryItem {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
}

export interface UserAuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: Prisma.JsonValue | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface UserDetail extends UserListItem {
  approvals: UserApprovalItem[];
  recentOrders: UserOrderSummaryItem[];
  auditLogs: UserAuditLogItem[];
}

export interface UserSummary {
  totalUsers: number;
  admins: number;
  merchants: number;
  vipClients: number;
  buyers: number;
  pendingApprovals: number;
  suspendedUsers: number;
}

export interface UserFilter {
  role?: Role | "ALL";
  status?: "ALL" | "ACTIVE" | "SUSPENDED" | "PENDING";
  search?: string;
}

export interface PendingApprovalItem {
  approvalId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  role: Role;
  requestedAt: Date;
}

export interface AuditLogListItem extends UserAuditLogItem {
  userName: string | null;
  userEmail: string;
}

export interface AuditLogFilter {
  entity?: string;
  action?: string;
  userId?: string;
}

// --- Helpers ---

function dec(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

// บันทึก audit log แบบ best-effort (ไม่ throw)
async function recordAudit(input: {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        details: input.details ?? Prisma.JsonNull,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (e) {
    console.error("recordAudit failed:", e);
  }
}

// --- Queries ---

export async function getUsers(
  filter?: UserFilter
): Promise<ActionResult<UserListItem[]>> {
  try {
    const where: Prisma.UserWhereInput = {};

    if (filter?.role && filter.role !== "ALL") {
      where.role = filter.role;
    }

    if (filter?.status && filter.status !== "ALL") {
      if (filter.status === "ACTIVE") {
        where.isActive = true;
      } else if (filter.status === "SUSPENDED") {
        where.isActive = false;
      } else if (filter.status === "PENDING") {
        where.approvals = {
          some: { status: ApprovalStatus.PENDING },
        };
      }
    }

    if (filter?.search) {
      where.OR = [
        { email: { contains: filter.search, mode: "insensitive" } },
        { name: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customerProfile: {
          select: {
            companyName: true,
            status: true,
            accountTier: true,
          },
        },
        approvals: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true },
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    const data: UserListItem[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      hasCustomerProfile: u.customerProfile !== null,
      customerCompany: u.customerProfile?.companyName ?? null,
      customerStatus: u.customerProfile?.status ?? null,
      customerTier: u.customerProfile?.accountTier ?? null,
      latestApprovalStatus: u.approvals[0]?.status ?? null,
      orderCount: u._count.orders,
      createdAt: u.createdAt,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getUsers failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load users.";
    return { data: null, error: message };
  }
}

export async function getUserById(
  id: string
): Promise<ActionResult<UserDetail>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: {
          select: {
            companyName: true,
            status: true,
            accountTier: true,
          },
        },
        approvals: {
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: { select: { id: true, name: true, email: true } },
          },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 25,
        },
        _count: { select: { orders: true } },
      },
    });

    if (!user) {
      return { data: null, error: "User not found." };
    }

    const detail: UserDetail = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasCustomerProfile: user.customerProfile !== null,
      customerCompany: user.customerProfile?.companyName ?? null,
      customerStatus: user.customerProfile?.status ?? null,
      customerTier: user.customerProfile?.accountTier ?? null,
      latestApprovalStatus: user.approvals[0]?.status ?? null,
      orderCount: user._count.orders,
      createdAt: user.createdAt,
      approvals: user.approvals.map((a) => ({
        id: a.id,
        status: a.status,
        reviewedBy: a.reviewedBy,
        reviewerName: a.reviewer?.name ?? a.reviewer?.email ?? null,
        reviewedAt: a.reviewedAt,
        note: a.note,
        createdAt: a.createdAt,
      })),
      recentOrders: user.orders.map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: dec(o.totalAmount),
        createdAt: o.createdAt,
      })),
      auditLogs: user.auditLogs.map((l) => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        details: l.details,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
    };

    return { data: detail, error: null };
  } catch (error: unknown) {
    console.error("getUserById failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load user.";
    return { data: null, error: message };
  }
}

export async function updateUserRole(
  id: string,
  role: Role,
  adminId?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!existing) {
      return { data: null, error: "User not found." };
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
    });

    // บันทึก audit log (ใช้ adminId ถ้ามี ไม่งั้นใช้ user ตัวเอง)
    await recordAudit({
      userId: adminId ?? id,
      action: "ROLE_CHANGED",
      entity: "User",
      entityId: id,
      details: { from: existing.role, to: role },
    });

    revalidatePath("/merchant/users");
    revalidatePath(`/merchant/users/${id}`);
    revalidatePath("/merchant");

    return { data: { id: updated.id }, error: null };
  } catch (error: unknown) {
    console.error("updateUserRole failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update role.";
    return { data: null, error: message };
  }
}

export async function approveUser(
  userId: string,
  adminId: string,
  note?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    // หา approval ล่าสุดที่ยัง PENDING
    const pending = await prisma.userApproval.findFirst({
      where: { userId, status: ApprovalStatus.PENDING },
      orderBy: { createdAt: "desc" },
    });

    let approvalId: string;

    if (pending) {
      const updated = await prisma.userApproval.update({
        where: { id: pending.id },
        data: {
          status: ApprovalStatus.APPROVED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          note: note?.trim() || null,
        },
      });
      approvalId = updated.id;
    } else {
      const created = await prisma.userApproval.create({
        data: {
          userId,
          status: ApprovalStatus.APPROVED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          note: note?.trim() || null,
        },
      });
      approvalId = created.id;
    }

    // เปิดใช้งาน user หลังจาก approve
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    // ถ้ามี customer profile ที่ PENDING ให้ activate ด้วย
    await prisma.customerProfile.updateMany({
      where: { userId, status: CustomerStatus.PENDING },
      data: { status: CustomerStatus.ACTIVE },
    });

    await recordAudit({
      userId: adminId,
      action: "USER_APPROVED",
      entity: "User",
      entityId: userId,
      details: { note: note ?? null },
    });

    revalidatePath("/merchant/users");
    revalidatePath("/merchant/users/approvals");
    revalidatePath(`/merchant/users/${userId}`);
    revalidatePath("/merchant");

    return { data: { id: approvalId }, error: null };
  } catch (error: unknown) {
    console.error("approveUser failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to approve user.";
    return { data: null, error: message };
  }
}

export async function rejectUser(
  userId: string,
  adminId: string,
  note: string
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!note || note.trim().length === 0) {
      return {
        data: null,
        error: "Note is required when rejecting a user.",
      };
    }

    const pending = await prisma.userApproval.findFirst({
      where: { userId, status: ApprovalStatus.PENDING },
      orderBy: { createdAt: "desc" },
    });

    let approvalId: string;

    if (pending) {
      const updated = await prisma.userApproval.update({
        where: { id: pending.id },
        data: {
          status: ApprovalStatus.REJECTED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          note: note.trim(),
        },
      });
      approvalId = updated.id;
    } else {
      const created = await prisma.userApproval.create({
        data: {
          userId,
          status: ApprovalStatus.REJECTED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          note: note.trim(),
        },
      });
      approvalId = created.id;
    }

    // ปิดการใช้งาน user หลัง reject
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await recordAudit({
      userId: adminId,
      action: "USER_REJECTED",
      entity: "User",
      entityId: userId,
      details: { note: note.trim() },
    });

    revalidatePath("/merchant/users");
    revalidatePath("/merchant/users/approvals");
    revalidatePath(`/merchant/users/${userId}`);
    revalidatePath("/merchant");

    return { data: { id: approvalId }, error: null };
  } catch (error: unknown) {
    console.error("rejectUser failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to reject user.";
    return { data: null, error: message };
  }
}

export async function suspendUser(
  id: string,
  adminId?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await recordAudit({
      userId: adminId ?? id,
      action: "USER_SUSPENDED",
      entity: "User",
      entityId: id,
    });

    revalidatePath("/merchant/users");
    revalidatePath(`/merchant/users/${id}`);
    revalidatePath("/merchant");

    return { data: { id: updated.id }, error: null };
  } catch (error: unknown) {
    console.error("suspendUser failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to suspend user.";
    return { data: null, error: message };
  }
}

export async function activateUser(
  id: string,
  adminId?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    await recordAudit({
      userId: adminId ?? id,
      action: "USER_ACTIVATED",
      entity: "User",
      entityId: id,
    });

    revalidatePath("/merchant/users");
    revalidatePath(`/merchant/users/${id}`);
    revalidatePath("/merchant");

    return { data: { id: updated.id }, error: null };
  } catch (error: unknown) {
    console.error("activateUser failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to activate user.";
    return { data: null, error: message };
  }
}

export async function getUserSummary(): Promise<ActionResult<UserSummary>> {
  try {
    const [
      totalUsers,
      admins,
      merchants,
      vipClients,
      buyers,
      pendingApprovals,
      suspendedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.ADMIN } }),
      prisma.user.count({ where: { role: Role.MERCHANT } }),
      prisma.user.count({ where: { role: Role.VIP_CLIENT } }),
      prisma.user.count({ where: { role: Role.USER } }),
      prisma.userApproval.count({
        where: { status: ApprovalStatus.PENDING },
      }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

    return {
      data: {
        totalUsers,
        admins,
        merchants,
        vipClients,
        buyers,
        pendingApprovals,
        suspendedUsers,
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("getUserSummary failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load user summary.";
    return { data: null, error: message };
  }
}

export async function getPendingApprovals(): Promise<
  ActionResult<PendingApprovalItem[]>
> {
  try {
    const approvals = await prisma.userApproval.findMany({
      where: { status: ApprovalStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    const data: PendingApprovalItem[] = approvals.map((a) => ({
      approvalId: a.id,
      userId: a.user.id,
      userName: a.user.name,
      userEmail: a.user.email,
      role: a.user.role,
      requestedAt: a.createdAt,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getPendingApprovals failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load pending approvals.";
    return { data: null, error: message };
  }
}

export async function getAuditLogs(
  filter?: AuditLogFilter
): Promise<ActionResult<AuditLogListItem[]>> {
  try {
    const where: Prisma.AuditLogWhereInput = {};
    if (filter?.entity) where.entity = filter.entity;
    if (filter?.action) where.action = filter.action;
    if (filter?.userId) where.userId = filter.userId;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const data: AuditLogListItem[] = logs.map((l) => ({
      id: l.id,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      details: l.details,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt,
      userName: l.user.name,
      userEmail: l.user.email,
    }));

    return { data, error: null };
  } catch (error: unknown) {
    console.error("getAuditLogs failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load audit logs.";
    return { data: null, error: message };
  }
}

// สร้าง user approval แบบ best-effort ตอน register
export async function createUserApproval(
  userId: string,
  autoApprove: boolean = false,
  reviewedBy?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const created = await prisma.userApproval.create({
      data: {
        userId,
        status: autoApprove
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.PENDING,
        reviewedBy: autoApprove ? reviewedBy ?? null : null,
        reviewedAt: autoApprove ? new Date() : null,
      },
    });

    revalidatePath("/merchant/users");
    revalidatePath("/merchant/users/approvals");

    return { data: { id: created.id }, error: null };
  } catch (error: unknown) {
    console.error("createUserApproval failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create user approval.";
    return { data: null, error: message };
  }
}
