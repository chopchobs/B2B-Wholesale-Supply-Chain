import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// --- Response helpers (รูปแบบ { data, error } เสมอ) ---

export interface ApiResponseShape<T> {
  data: T | null;
  error: string | null;
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data, error: null } as ApiResponseShape<T>, {
    status,
  });
}

export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ data: null, error: message } as ApiResponseShape<never>, {
    status,
  });
}

// --- Pagination helper ---

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const pageRaw = Number(searchParams.get("page") ?? 1);
  const limitRaw = Number(searchParams.get("limit") ?? 20);

  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  // จำกัด limit ไม่ให้เกิน 100 และไม่ต่ำกว่า 1
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.floor(limitRaw), 100)
      : 20;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// --- Auth helpers ---

export interface AuthContext {
  userId: string;
  role: string;
}

// AuthError ใช้ throw จาก helper เพื่อให้ route handler ตอบ 401/403 อัตโนมัติ
export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// requireAuth: ตรวจ session ผ่าน Supabase แล้วดึง role จาก DB
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("Unauthorized", 401);
  }

  // โหลด role จาก Prisma (Supabase user.id ตรงกับ User.id)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, isActive: true },
  });

  if (!dbUser) {
    throw new AuthError("Unauthorized", 401);
  }

  if (!dbUser.isActive) {
    throw new AuthError("Forbidden: account is disabled", 403);
  }

  return { userId: dbUser.id, role: dbUser.role };
}

// requireMerchant: ต้องเป็น MERCHANT หรือ ADMIN เท่านั้น
export async function requireMerchant(): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (ctx.role !== "MERCHANT" && ctx.role !== "ADMIN") {
    throw new AuthError("Forbidden: merchant role required", 403);
  }
  return ctx;
}

// handleApiError: ใช้แปลง AuthError / Error ทั่วไปเป็น Response
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return apiError(err.message, err.status);
  }
  const message = err instanceof Error ? err.message : "Internal Server Error";
  return apiError(message, 500);
}
