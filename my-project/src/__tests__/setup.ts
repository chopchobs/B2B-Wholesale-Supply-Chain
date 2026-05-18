import { vi } from "vitest";

// Global test setup — env vars จำเป็นก่อนโหลด module อื่น
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

// Mock next/cache ระดับ global — กัน revalidatePath ใน server actions ล้ม
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock next/headers ระดับ global
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
  headers: vi.fn().mockResolvedValue(new Headers()),
}));
