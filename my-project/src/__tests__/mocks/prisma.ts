import { vi } from "vitest";

// Mock Prisma client — แทน @/lib/prisma ในทุก test
export const prismaMock = {
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  order: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  orderItem: {
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
  inventoryItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
  },
  inventoryTransaction: {
    create: vi.fn(),
    createMany: vi.fn(),
  },
  customerProfile: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  warehouse: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  returnRequest: {
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
