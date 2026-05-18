import { vi } from "vitest";

// Mock Supabase server client
export const supabaseMock = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(supabaseMock),
}));

// Mock next/headers — บาง route handler ใช้ cookies/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock next/cache — กัน revalidatePath ใน server actions ระเบิด
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
