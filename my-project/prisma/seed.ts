import "dotenv/config";
import {
  PrismaClient,
  CarrierStatus,
  Role,
  CustomerTier,
  CustomerStatus,
  OrderStatus,
  InvoiceStatus,
  PaymentMethod,
  SupplierStatus,
  PurchaseOrderStatus,
  ShipmentStatus,
  ShipmentEventType,
  ReturnStatus,
  ReturnReason,
  RefundMethod,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------- Utilities ----------

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 86_400_000);
}

function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n.toFixed(2));
}

// ---------- Existing Phase 17 seeds (carriers / zones / rates) ----------

async function seedCarriers() {
  const carriers = [
    {
      name: "Kerry Express",
      code: "KERRY",
      status: CarrierStatus.ACTIVE,
      trackingUrl: "https://th.kerryexpress.com/en/track/?track={TRACKING}",
      contactEmail: "support@kerryexpress.com",
      contactPhone: "1217",
    },
    {
      name: "Flash Express",
      code: "FLASH",
      status: CarrierStatus.ACTIVE,
      trackingUrl: "https://www.flashexpress.co.th/fle/tracking/?se={TRACKING}",
      contactEmail: "cs@flashexpress.com",
      contactPhone: "02-068-3300",
    },
    {
      name: "Thailand Post",
      code: "THPOST",
      status: CarrierStatus.ACTIVE,
      trackingUrl: "https://track.thailandpost.co.th/?trackNumber={TRACKING}",
      contactEmail: "callcenter@thailandpost.co.th",
      contactPhone: "1545",
    },
    {
      name: "DHL Express",
      code: "DHL",
      status: CarrierStatus.ACTIVE,
      trackingUrl:
        "https://www.dhl.com/th-en/home/tracking.html?tracking-id={TRACKING}",
      contactEmail: "customer.service@dhl.com",
      contactPhone: "02-345-5000",
    },
    {
      name: "J&T Express",
      code: "JT",
      status: CarrierStatus.ACTIVE,
      trackingUrl:
        "https://www.jtexpress.co.th/index/query/gzquery.html?bills={TRACKING}",
      contactEmail: "service.th@jtexpress.com",
      contactPhone: "02-033-3900",
    },
  ];

  console.log("🚚 Seeding carriers...");
  for (const c of carriers) {
    await prisma.carrier.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }
  console.log(`  ✓ ${carriers.length} carriers`);
}

async function seedShippingZones() {
  const zones: Array<{
    name: string;
    description: string;
    regions: Prisma.InputJsonValue;
  }> = [
    {
      name: "Bangkok Metro",
      description: "กรุงเทพฯ และปริมณฑล",
      regions: { provinces: ["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ"] },
    },
    {
      name: "Central Thailand",
      description: "ภาคกลาง (ยกเว้น กทม.และปริมณฑล)",
      regions: { provinces: ["อยุธยา", "ลพบุรี", "สระบุรี", "นครปฐม"] },
    },
    {
      name: "Northern Thailand",
      description: "ภาคเหนือ",
      regions: { provinces: ["เชียงใหม่", "เชียงราย", "ลำปาง"] },
    },
    {
      name: "Northeastern Thailand",
      description: "ภาคตะวันออกเฉียงเหนือ (อีสาน)",
      regions: { provinces: ["นครราชสีมา", "ขอนแก่น", "อุดรธานี"] },
    },
    {
      name: "Eastern Thailand",
      description: "ภาคตะวันออก",
      regions: { provinces: ["ชลบุรี", "ระยอง", "จันทบุรี"] },
    },
    {
      name: "Southern Thailand",
      description: "ภาคใต้",
      regions: { provinces: ["ภูเก็ต", "สงขลา", "สุราษฎร์ธานี"] },
    },
    {
      name: "International",
      description: "ต่างประเทศทั่วโลก",
      regions: { countries: ["ALL"] },
    },
  ];

  console.log("🗺️  Seeding shipping zones...");
  for (const z of zones) {
    await prisma.shippingZone.upsert({
      where: { name: z.name },
      update: {},
      create: z,
    });
  }
  console.log(`  ✓ ${zones.length} zones`);
}

async function seedShippingRates() {
  console.log("💰 Seeding shipping rates...");

  const carriers = await prisma.carrier.findMany();
  const zones = await prisma.shippingZone.findMany({
    where: { name: { not: "International" } },
  });

  const carrierByCode = new Map(carriers.map((c) => [c.code, c]));
  const kerry = carrierByCode.get("KERRY");
  const flash = carrierByCode.get("FLASH");
  const thpost = carrierByCode.get("THPOST");
  if (!kerry || !flash || !thpost) return;

  type RateInput = {
    carrierId: string;
    zoneId: string;
    serviceName: string;
    baseRate: number;
    perKgRate: number;
    estimatedDays: number;
  };

  const rates: RateInput[] = [];
  for (const z of zones) {
    const isBkk = z.name === "Bangkok Metro";
    rates.push({
      carrierId: kerry.id,
      zoneId: z.id,
      serviceName: "Standard",
      baseRate: isBkk ? 35 : 50,
      perKgRate: isBkk ? 8 : 12,
      estimatedDays: isBkk ? 1 : 3,
    });
    rates.push({
      carrierId: flash.id,
      zoneId: z.id,
      serviceName: "Standard",
      baseRate: isBkk ? 30 : 45,
      perKgRate: isBkk ? 7 : 11,
      estimatedDays: isBkk ? 1 : 3,
    });
    rates.push({
      carrierId: thpost.id,
      zoneId: z.id,
      serviceName: "Standard",
      baseRate: isBkk ? 25 : 35,
      perKgRate: isBkk ? 5 : 8,
      estimatedDays: isBkk ? 2 : 4,
    });
  }

  let created = 0;
  for (const r of rates) {
    const exists = await prisma.shippingRate.findFirst({
      where: { carrierId: r.carrierId, zoneId: r.zoneId, serviceName: r.serviceName },
    });
    if (!exists) {
      await prisma.shippingRate.create({ data: r });
      created++;
    }
  }
  console.log(`  ✓ ${created} new rates (${rates.length - created} existed)`);
}

// ---------- Phase 26 demo dataset ----------

async function seedUsers() {
  console.log("👥 Seeding users...");
  const users = [
    { id: "seed-merchant-01", email: "merchant@demo.com", name: "Demo Merchant", role: Role.MERCHANT },
    { id: "seed-buyer-01", email: "buyer1@demo.com", name: "Somchai Trading", role: Role.USER },
    { id: "seed-buyer-02", email: "buyer2@demo.com", name: "Aroon Suksai", role: Role.USER },
    { id: "seed-buyer-03", email: "buyer3@demo.com", name: "Nattha Wong", role: Role.USER },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { email: u.email, name: u.name, role: u.role, isActive: true },
      create: { ...u, isActive: true },
    });
  }
  console.log(`  ✓ ${users.length} users`);
}

async function seedShop(): Promise<string> {
  console.log("🏪 Seeding shop...");
  const shop = await prisma.shop.upsert({
    where: { id: "seed-shop-01" },
    update: {},
    create: {
      id: "seed-shop-01",
      name: "Thai Wholesale Co.",
      description: "ผู้จัดจำหน่ายสินค้า B2B แบบครบวงจรในประเทศไทย",
      isActive: true,
      ownerId: "seed-merchant-01",
    },
  });
  console.log(`  ✓ ${shop.name}`);
  return shop.id;
}

async function seedWarehouses(): Promise<string[]> {
  console.log("🏬 Seeding warehouses...");
  const warehouses = [
    { id: "seed-wh-01", name: "Bangkok Main", code: "BKK-MAIN", city: "Bangkok", capacity: 20000, isDefault: true },
    { id: "seed-wh-02", name: "Chiang Mai Hub", code: "CNX-HUB", city: "Chiang Mai", capacity: 12000, isDefault: false },
    { id: "seed-wh-03", name: "Phuket South", code: "HKT-STH", city: "Phuket", capacity: 8000, isDefault: false },
    { id: "seed-wh-04", name: "Korat Central", code: "KRT-CTR", city: "Nakhon Ratchasima", capacity: 10000, isDefault: false },
    { id: "seed-wh-05", name: "Hat Yai Depot", code: "HDY-DPT", city: "Songkhla", capacity: 5000, isDefault: false },
  ];
  for (const w of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: w.code },
      update: { name: w.name, city: w.city, capacity: w.capacity },
      create: {
        ...w,
        country: "Thailand",
        address: `${w.name} Warehouse, ${w.city}`,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ ${warehouses.length} warehouses`);
  return warehouses.map((w) => w.id);
}

async function seedCategories(): Promise<{ id: string; name: string }[]> {
  console.log("🏷️  Seeding categories...");
  const names = ["Electronics", "Fresh Produce", "Beverages", "Household", "Clothing", "Industrial"];
  const out: { id: string; name: string }[] = [];
  for (let i = 0; i < names.length; i++) {
    const id = `seed-cat-${String(i + 1).padStart(2, "0")}`;
    const cat = await prisma.category.upsert({
      where: { name: names[i] },
      update: {},
      create: { id, name: names[i], isActive: true },
    });
    out.push({ id: cat.id, name: cat.name });
  }
  console.log(`  ✓ ${out.length} categories`);
  return out;
}

const PRODUCT_NAMES: Record<string, string[]> = {
  Electronics: [
    "LED Bulb 9W",
    "Power Strip 6-Outlet",
    "USB-C Cable 1m",
    "Wireless Mouse",
    "HDMI Cable 2m",
    "Bluetooth Speaker",
    "Phone Charger 20W",
    "Memory Card 64GB",
  ],
  "Fresh Produce": [
    "Jasmine Rice 5kg",
    "Fresh Mango Box",
    "Coconut 20pcs",
    "Pineapple Crate",
    "Banana 10kg",
    "Lime 5kg",
    "Chili Pepper 2kg",
    "Garlic 5kg",
  ],
  Beverages: [
    "Bottled Water 24-pack",
    "Coffee Beans 1kg",
    "Green Tea 50 bags",
    "Coconut Water 24-pack",
    "Soda Carton",
    "Energy Drink 24-pack",
    "Milk UHT 12-pack",
    "Juice Box 24-pack",
  ],
  Household: [
    "Dish Soap 1L",
    "Laundry Detergent 5kg",
    "Toilet Paper 24-roll",
    "Hand Soap 1L",
    "Trash Bags 100ct",
    "Floor Cleaner 5L",
    "Sponges 12-pack",
    "Air Freshener",
  ],
  Clothing: [
    "Cotton T-Shirt Bundle",
    "Workwear Trousers",
    "Apron Pack 10pcs",
    "Safety Vest",
    "Polo Shirt Bundle",
    "Cap 12-pack",
    "Socks 24-pair",
    "Gloves 50-pair",
  ],
  Industrial: [
    "Cardboard Box 50-pack",
    "Packing Tape 12-roll",
    "Stretch Wrap Film",
    "Pallet Wood",
    "Steel Strap 100m",
    "Bubble Wrap Roll",
    "Cable Tie 500ct",
    "Work Gloves Industrial",
  ],
};

async function seedProducts(
  shopId: string,
  categories: { id: string; name: string }[],
  warehouseIds: string[],
) {
  console.log("📦 Seeding products + price tiers + inventory...");
  let productCount = 0;
  let tierCount = 0;
  let invCount = 0;

  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    const names = PRODUCT_NAMES[cat.name] ?? [];
    const prefix = cat.name.substring(0, 3).toUpperCase();

    for (let pi = 0; pi < names.length; pi++) {
      const seq = pi + 1;
      const id = `seed-prod-${String(ci + 1).padStart(2, "0")}-${String(seq).padStart(3, "0")}`;
      const sku = `${prefix}-${String(ci + 1).padStart(2, "0")}${String(seq).padStart(3, "0")}`;
      const basePrice = randInt(50, 5000);

      await prisma.product.upsert({
        where: { id },
        update: {},
        create: {
          id,
          sku,
          name: names[pi],
          description: `${names[pi]} - ${cat.name} category for B2B wholesale`,
          basePrice: dec(basePrice),
          moq: pick([1, 5, 10]),
          stock: 0,
          isActive: true,
          shopId,
          categoryId: cat.id,
        },
      });
      productCount++;

      // Price tiers: 3 tiers
      const tiers = [
        { id: `${id}-tier-1`, minQuantity: 1, unitPrice: dec(basePrice) },
        { id: `${id}-tier-2`, minQuantity: 10, unitPrice: dec(basePrice * 0.9) },
        { id: `${id}-tier-3`, minQuantity: 50, unitPrice: dec(basePrice * 0.8) },
      ];
      for (const t of tiers) {
        await prisma.priceTier.upsert({
          where: { id: t.id },
          update: {},
          create: {
            id: t.id,
            productId: id,
            minQuantity: t.minQuantity,
            unitPrice: t.unitPrice,
            targetRole: Role.VIP_CLIENT,
            isActive: true,
          },
        });
        tierCount++;
      }

      // InventoryItems in 2-3 warehouses (deterministic เพื่อ idempotent)
      const numWh = 2 + (seq % 2); // 2 หรือ 3 อันตาม seq
      const chosen: string[] = [];
      for (let w = 0; w < numWh; w++) {
        chosen.push(warehouseIds[(ci + pi + w) % warehouseIds.length]);
      }
      for (let w = 0; w < chosen.length; w++) {
        const whId = chosen[w];
        const invId = `${id}-inv-${whId}`;
        await prisma.inventoryItem.upsert({
          where: {
            productId_warehouseId: { productId: id, warehouseId: whId },
          },
          update: {},
          create: {
            id: invId,
            productId: id,
            warehouseId: whId,
            quantity: randInt(10, 500),
            lowStockThreshold: randInt(10, 50),
            location: "MAIN-WH",
          },
        });
        invCount++;
      }
    }
  }
  console.log(`  ✓ ${productCount} products, ${tierCount} price tiers, ${invCount} inventory items`);
}

async function seedCustomers() {
  console.log("🏢 Seeding customer profiles + contacts...");

  // ขยายเป็น 20 customers — เพิ่ม user เสริมอีก 17 คน
  const buyers = ["seed-buyer-01", "seed-buyer-02", "seed-buyer-03"];
  const allCustomerUserIds: string[] = [];

  // ใช้ buyer 3 คนแรกเป็น CustomerProfile แรก
  for (let i = 0; i < 3; i++) {
    allCustomerUserIds.push(buyers[i]);
  }
  // สร้าง User เพิ่ม 17 คนสำหรับ customer
  for (let i = 4; i <= 20; i++) {
    const uid = `seed-cust-user-${String(i).padStart(2, "0")}`;
    await prisma.user.upsert({
      where: { id: uid },
      update: {},
      create: {
        id: uid,
        email: `customer${i}@demo.com`,
        name: `Customer ${i}`,
        role: Role.USER,
        isActive: true,
      },
    });
    allCustomerUserIds.push(uid);
  }

  const companies = [
    "Siam Trading Ltd.",
    "Northern Foods Co.",
    "Bangkok Beverages Inc.",
    "Thai Hospitality Group",
    "Phuket Resort Supply",
    "Chiang Mai Cafe Co.",
    "Pattaya Hotel Chain",
    "Krabi Boat Tours",
    "Isan Restaurant Group",
    "Riverside Markets",
    "Golden Lotus Trading",
    "Royal Thai Imports",
    "Sukhumvit Wholesale",
    "Andaman Seafood Co.",
    "Mekong Logistics",
    "Lanna Crafts Ltd.",
    "Suvarnabhumi Supply",
    "Asoke Retail Group",
    "Silom Trading House",
    "Charoen Industries",
  ];

  const tiers = [CustomerTier.BRONZE, CustomerTier.SILVER, CustomerTier.GOLD, CustomerTier.PLATINUM];
  let count = 0;
  for (let i = 0; i < 20; i++) {
    const userId = allCustomerUserIds[i];
    const id = `seed-cust-${String(i + 1).padStart(2, "0")}`;
    await prisma.customerProfile.upsert({
      where: { userId },
      update: {},
      create: {
        id,
        userId,
        companyName: companies[i],
        taxId: `0${randInt(1000000000000, 9999999999999)}`,
        creditLimit: dec(randInt(10000, 500000)),
        creditUsed: dec(randInt(0, 50000)),
        accountTier: tiers[i % tiers.length],
        status: i < 17 ? CustomerStatus.ACTIVE : CustomerStatus.PENDING,
        billingAddress: `${randInt(1, 999)}/${randInt(1, 99)} Demo Road, Bangkok 10110`,
        shippingAddress: `${randInt(1, 999)}/${randInt(1, 99)} Demo Road, Bangkok 10110`,
        notes: "Seed demo customer",
      },
    });
    count++;

    // Contacts 1-2 per profile
    const numContacts = randInt(1, 2);
    for (let c = 1; c <= numContacts; c++) {
      const cid = `${id}-contact-${c}`;
      await prisma.customerContact.upsert({
        where: { id: cid },
        update: {},
        create: {
          id: cid,
          customerId: id,
          name: c === 1 ? `Primary Contact ${i + 1}` : `Secondary Contact ${i + 1}`,
          email: `contact${c}@${companies[i].split(" ")[0].toLowerCase()}.demo`,
          phone: `08${randInt(10000000, 99999999)}`,
          role: c === 1 ? "Procurement Manager" : "Accounting",
          isPrimary: c === 1,
        },
      });
    }
  }
  console.log(`  ✓ ${count} customer profiles`);
}

type SeedProduct = { id: string; basePrice: Prisma.Decimal };

async function seedOrders(): Promise<void> {
  console.log("🛒 Seeding orders + order items...");

  const buyers = ["seed-buyer-01", "seed-buyer-02", "seed-buyer-03"];
  const products = await prisma.product.findMany({
    where: { id: { startsWith: "seed-prod-" } },
    select: { id: true, basePrice: true },
  });

  if (products.length === 0) {
    console.log("  ⚠️  No products to create orders from");
    return;
  }

  const plan: { status: OrderStatus; count: number }[] = [
    { status: OrderStatus.PENDING, count: 10 },
    // CONFIRMED ไม่มีใน enum -> ใช้ PROCESSING เพิ่ม 15
    { status: OrderStatus.PROCESSING, count: 15 + 20 },
    { status: OrderStatus.SHIPPED, count: 25 },
    { status: OrderStatus.DELIVERED, count: 25 },
    { status: OrderStatus.CANCELLED, count: 5 },
  ];

  let idx = 0;
  for (const slot of plan) {
    for (let i = 0; i < slot.count; i++) {
      idx++;
      const orderId = `seed-order-${String(idx).padStart(3, "0")}`;

      // เช็คว่ามีอยู่แล้วไหม (idempotent)
      const exists = await prisma.order.findUnique({ where: { id: orderId } });
      if (exists) continue;

      const numItems = randInt(2, 5);
      const chosenProducts: SeedProduct[] = [];
      const used = new Set<string>();
      while (chosenProducts.length < numItems && chosenProducts.length < products.length) {
        const p = products[randInt(0, products.length - 1)];
        if (!used.has(p.id)) {
          used.add(p.id);
          chosenProducts.push(p);
        }
      }

      const itemsData = chosenProducts.map((p) => {
        const qty = randInt(1, 20);
        const unitPrice = new Prisma.Decimal(p.basePrice);
        const subTotal = unitPrice.mul(qty);
        return { productId: p.id, quantity: qty, unitPrice, subTotal };
      });
      const total = itemsData.reduce(
        (acc, it) => acc.add(it.subTotal),
        new Prisma.Decimal(0),
      );

      const createdAt = daysAgo(randInt(0, 90));

      await prisma.order.create({
        data: {
          id: orderId,
          userId: pick(buyers),
          status: slot.status,
          totalAmount: total,
          createdAt,
          updatedAt: createdAt,
          items: {
            create: itemsData.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              subTotal: it.subTotal,
            })),
          },
        },
      });
    }
  }
  const total = await prisma.order.count({ where: { id: { startsWith: "seed-order-" } } });
  console.log(`  ✓ ${total} orders`);
}

async function seedInvoices() {
  console.log("🧾 Seeding invoices + payments...");

  const orders = await prisma.order.findMany({
    where: {
      id: { startsWith: "seed-order-" },
      status: { not: OrderStatus.CANCELLED },
      invoice: null,
    },
    take: 30,
    orderBy: { createdAt: "asc" },
  });

  const plan: InvoiceStatus[] = [
    ...Array<InvoiceStatus>(5).fill(InvoiceStatus.DRAFT),
    ...Array<InvoiceStatus>(10).fill(InvoiceStatus.SENT),
    ...Array<InvoiceStatus>(10).fill(InvoiceStatus.PAID),
    ...Array<InvoiceStatus>(5).fill(InvoiceStatus.OVERDUE),
  ];

  let count = 0;
  for (let i = 0; i < Math.min(orders.length, plan.length); i++) {
    const order = orders[i];
    const status = plan[i];
    const issuedAt = order.createdAt;
    const dueDate = new Date(issuedAt.getTime() + 30 * 86_400_000);
    const subtotal = order.totalAmount;
    const tax = new Prisma.Decimal(subtotal).mul(0.07);
    const total = new Prisma.Decimal(subtotal).add(tax);
    const yyyymm = `${issuedAt.getFullYear()}${String(issuedAt.getMonth() + 1).padStart(2, "0")}`;
    const invoiceNumber = `INV-${yyyymm}-${String(i + 1).padStart(4, "0")}`;
    const invoiceId = `seed-inv-${String(i + 1).padStart(3, "0")}`;

    await prisma.invoice.upsert({
      where: { id: invoiceId },
      update: {},
      create: {
        id: invoiceId,
        invoiceNumber,
        orderId: order.id,
        status,
        issuedAt,
        dueDate,
        paidAt: status === InvoiceStatus.PAID ? new Date(issuedAt.getTime() + 15 * 86_400_000) : null,
        subtotal,
        tax,
        total,
        notes: "Demo seed invoice",
      },
    });

    if (status === InvoiceStatus.PAID) {
      const payId = `${invoiceId}-pay-01`;
      const existsPay = await prisma.paymentRecord.findUnique({ where: { id: payId } });
      if (!existsPay) {
        await prisma.paymentRecord.create({
          data: {
            id: payId,
            invoiceId,
            amount: total,
            method: PaymentMethod.BANK_TRANSFER,
            reference: `TXN-${randInt(100000, 999999)}`,
            paidAt: new Date(issuedAt.getTime() + 15 * 86_400_000),
            note: "Full payment",
          },
        });
      }
    }
    count++;
  }
  console.log(`  ✓ ${count} invoices`);
}

async function seedSuppliers(): Promise<string[]> {
  console.log("🏭 Seeding suppliers...");
  const suppliers = [
    { id: "seed-sup-01", name: "Thai Electronics Supply", email: "sales@thaielec.demo" },
    { id: "seed-sup-02", name: "Fresh Farm Direct", email: "orders@freshfarm.demo" },
    { id: "seed-sup-03", name: "Beverage Masters", email: "info@bevmaster.demo" },
    { id: "seed-sup-04", name: "Home Essentials Co.", email: "sales@homeess.demo" },
    { id: "seed-sup-05", name: "Industrial Parts Ltd.", email: "contact@indparts.demo" },
  ];
  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        email: s.email,
        phone: `02-${randInt(1000000, 9999999)}`,
        address: "Bangkok Industrial Zone, Thailand",
        contactPerson: "Supplier Manager",
        status: SupplierStatus.ACTIVE,
        notes: "Seed demo supplier",
      },
    });
  }
  console.log(`  ✓ ${suppliers.length} suppliers`);
  return suppliers.map((s) => s.id);
}

async function seedPurchaseOrders(supplierIds: string[]) {
  console.log("📑 Seeding purchase orders...");
  const products = await prisma.product.findMany({
    where: { id: { startsWith: "seed-prod-" } },
    select: { id: true, basePrice: true },
  });

  const plan: PurchaseOrderStatus[] = [
    ...Array<PurchaseOrderStatus>(3).fill(PurchaseOrderStatus.DRAFT),
    ...Array<PurchaseOrderStatus>(3).fill(PurchaseOrderStatus.SENT),
    ...Array<PurchaseOrderStatus>(3).fill(PurchaseOrderStatus.CONFIRMED),
    ...Array<PurchaseOrderStatus>(4).fill(PurchaseOrderStatus.RECEIVED),
    ...Array<PurchaseOrderStatus>(2).fill(PurchaseOrderStatus.CANCELLED),
  ];

  for (let i = 0; i < plan.length; i++) {
    const poId = `seed-po-${String(i + 1).padStart(3, "0")}`;
    const existing = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (existing) continue;

    const numItems = randInt(3, 5);
    const chosen: SeedProduct[] = [];
    const used = new Set<string>();
    while (chosen.length < numItems) {
      const p = products[randInt(0, products.length - 1)];
      if (!used.has(p.id)) {
        used.add(p.id);
        chosen.push(p);
      }
    }

    const items = chosen.map((p) => {
      const qty = randInt(20, 200);
      // ราคาทุน = 70% ของ basePrice
      const unitCost = new Prisma.Decimal(p.basePrice).mul(0.7);
      const total = unitCost.mul(qty);
      return { productId: p.id, quantity: qty, unitCost, total };
    });
    const subtotal = items.reduce((a, x) => a.add(x.total), new Prisma.Decimal(0));
    const yyyymm = "202605";
    const poNumber = `PO-${yyyymm}-${String(i + 1).padStart(4, "0")}`;

    await prisma.purchaseOrder.create({
      data: {
        id: poId,
        poNumber,
        supplierId: pick(supplierIds),
        status: plan[i],
        expectedDelivery: daysAgo(-randInt(7, 30)),
        subtotal,
        total: subtotal,
        notes: "Demo seed PO",
        items: {
          create: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitCost: it.unitCost,
            total: it.total,
          })),
        },
      },
    });
  }
  const cnt = await prisma.purchaseOrder.count({ where: { id: { startsWith: "seed-po-" } } });
  console.log(`  ✓ ${cnt} purchase orders`);
}

async function seedShipments() {
  console.log("🚛 Seeding shipments + events...");

  const orders = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
    },
    include: { items: true },
    take: 20,
  });

  const carriers = await prisma.carrier.findMany();
  if (carriers.length === 0) return;

  let count = 0;
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const shipId = `seed-ship-${String(i + 1).padStart(3, "0")}`;
    const existing = await prisma.shipment.findUnique({ where: { id: shipId } });
    if (existing) continue;

    const isDelivered = i < 10; // 10 DELIVERED, 10 IN_TRANSIT
    const status = isDelivered ? ShipmentStatus.DELIVERED : ShipmentStatus.IN_TRANSIT;
    const yyyymm = "202605";
    const shipmentNumber = `SHP-${yyyymm}-${String(i + 1).padStart(4, "0")}`;
    const carrier = pick(carriers);
    const shippedAt = daysAgo(randInt(1, 20));
    const deliveredAt = isDelivered ? new Date(shippedAt.getTime() + 3 * 86_400_000) : null;

    await prisma.shipment.create({
      data: {
        id: shipId,
        shipmentNumber,
        orderId: order.id,
        carrierId: carrier.id,
        trackingNumber: `${carrier.code}${randInt(100000000, 999999999)}`,
        status,
        shippingCost: dec(randInt(50, 300)),
        weightKg: dec(randInt(1, 30)),
        shipToName: `Customer ${order.userId.slice(-2)}`,
        shipToPhone: `08${randInt(10000000, 99999999)}`,
        shipToAddress: "123/45 Demo Road, Bangkok",
        shipToCity: "Bangkok",
        shipToPostal: "10110",
        shipToCountry: "Thailand",
        createdById: "seed-merchant-01",
        shippedAt,
        deliveredAt,
        estimatedDelivery: new Date(shippedAt.getTime() + 3 * 86_400_000),
        items: {
          create: order.items.slice(0, 2).map((it) => ({
            orderItemId: it.id,
            quantity: it.quantity,
          })),
        },
        events: {
          create: [
            {
              type: ShipmentEventType.CREATED,
              message: "Shipment created",
              location: "Warehouse",
              occurredAt: shippedAt,
            },
            {
              type: ShipmentEventType.PICKED_UP,
              message: "Picked up by carrier",
              location: "Bangkok Hub",
              occurredAt: new Date(shippedAt.getTime() + 3600_000),
            },
            ...(isDelivered
              ? [
                  {
                    type: ShipmentEventType.DELIVERED,
                    message: "Delivered successfully",
                    location: "Customer address",
                    occurredAt: deliveredAt!,
                  },
                ]
              : [
                  {
                    type: ShipmentEventType.IN_TRANSIT,
                    message: "In transit",
                    location: "Distribution Center",
                    occurredAt: new Date(shippedAt.getTime() + 86_400_000),
                  },
                ]),
          ],
        },
      },
    });
    count++;
  }
  console.log(`  ✓ ${count} shipments`);
}

async function seedReturns() {
  console.log("↩️  Seeding return requests...");

  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.DELIVERED,
    },
    include: { items: true },
    take: 10,
  });

  const plan: ReturnStatus[] = [
    ...Array<ReturnStatus>(3).fill(ReturnStatus.REQUESTED),
    ...Array<ReturnStatus>(3).fill(ReturnStatus.APPROVED),
    ...Array<ReturnStatus>(3).fill(ReturnStatus.REFUNDED),
    ReturnStatus.REJECTED,
  ];

  let count = 0;
  for (let i = 0; i < Math.min(orders.length, plan.length); i++) {
    const order = orders[i];
    if (order.items.length === 0) continue;
    const rmaId = `seed-rma-${String(i + 1).padStart(3, "0")}`;
    const existing = await prisma.returnRequest.findUnique({ where: { id: rmaId } });
    if (existing) continue;

    const status = plan[i];
    const item = order.items[0];
    const returnQty = Math.min(item.quantity, randInt(1, 3));
    const unitPrice = new Prisma.Decimal(item.unitPrice);
    const subTotal = unitPrice.mul(returnQty);

    await prisma.returnRequest.create({
      data: {
        id: rmaId,
        returnNumber: `RMA-202605-${String(i + 1).padStart(4, "0")}`,
        orderId: order.id,
        requestedById: order.userId,
        reviewedById: status !== ReturnStatus.REQUESTED ? "seed-merchant-01" : null,
        reviewedAt: status !== ReturnStatus.REQUESTED ? daysAgo(randInt(1, 10)) : null,
        status,
        reason: pick([
          ReturnReason.DAMAGED,
          ReturnReason.DEFECTIVE,
          ReturnReason.WRONG_ITEM,
          ReturnReason.NOT_AS_DESCRIBED,
        ]),
        reasonNote: "ลูกค้าระบุปัญหาคุณภาพสินค้า",
        refundAmount: subTotal,
        refundMethod: RefundMethod.ORIGINAL_PAYMENT,
        refundedAt: status === ReturnStatus.REFUNDED ? daysAgo(randInt(1, 5)) : null,
        notes: "Seed demo return",
        items: {
          create: [
            {
              orderItemId: item.id,
              quantity: returnQty,
              unitPrice,
              subTotal,
              restock: true,
            },
          ],
        },
      },
    });
    count++;
  }
  console.log(`  ✓ ${count} return requests`);
}

async function seedNotifications() {
  console.log("🔔 Seeding notifications...");
  const merchantId = "seed-merchant-01";

  const notifs: Array<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
  }> = [
    { id: "seed-notif-01", type: NotificationType.LOW_STOCK, title: "Low stock alert", message: "LED Bulb 9W ต่ำกว่าเกณฑ์", isRead: false },
    { id: "seed-notif-02", type: NotificationType.LOW_STOCK, title: "Low stock alert", message: "Coffee Beans 1kg ต่ำกว่าเกณฑ์", isRead: false },
    { id: "seed-notif-03", type: NotificationType.OUT_OF_STOCK, title: "Out of stock", message: "Pallet Wood หมดสต็อก", isRead: true },
    { id: "seed-notif-04", type: NotificationType.NEW_ORDER, title: "New order received", message: "Order #SO-0123 รอการยืนยัน", isRead: false },
    { id: "seed-notif-05", type: NotificationType.NEW_ORDER, title: "New order received", message: "Order #SO-0124 รอการยืนยัน", isRead: true },
    { id: "seed-notif-06", type: NotificationType.ORDER_STATUS_CHANGED, title: "Order shipped", message: "Order #SO-0100 ถูกจัดส่งแล้ว", isRead: true },
    { id: "seed-notif-07", type: NotificationType.INVOICE_OVERDUE, title: "Invoice overdue", message: "Invoice INV-202604-0005 เกินกำหนดชำระ", isRead: false },
    { id: "seed-notif-08", type: NotificationType.SHIPMENT_UPDATE, title: "Shipment delivered", message: "Shipment SHP-202605-0001 ส่งถึงผู้รับแล้ว", isRead: true },
    { id: "seed-notif-09", type: NotificationType.PURCHASE_ORDER_UPDATE, title: "PO received", message: "PO-202605-0004 ได้รับสินค้าครบถ้วน", isRead: false },
    { id: "seed-notif-10", type: NotificationType.SYSTEM, title: "Welcome to demo", message: "ระบบเดโม่พร้อมใช้งานแล้ว", isRead: true },
  ];

  for (const n of notifs) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: {
        id: n.id,
        userId: merchantId,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        link: "/merchant",
      },
    });
  }
  console.log(`  ✓ ${notifs.length} notifications`);
}

// ---------- Main ----------

async function main() {
  console.log("🌱 Starting full demo seed...\n");

  // Phase 17
  await seedCarriers();
  await seedShippingZones();
  await seedShippingRates();

  // Phase 26 — base entities
  await seedUsers();
  const shopId = await seedShop();
  const warehouseIds = await seedWarehouses();
  const categories = await seedCategories();

  // Products + inventory
  await seedProducts(shopId, categories, warehouseIds);

  // Customers
  await seedCustomers();

  // Orders → Invoices
  await seedOrders();
  await seedInvoices();

  // Supply chain
  const supplierIds = await seedSuppliers();
  await seedPurchaseOrders(supplierIds);

  // Logistics
  await seedShipments();
  await seedReturns();

  // Notifications
  await seedNotifications();

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
