import "dotenv/config";
import { PrismaClient, CarrierStatus } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
      trackingUrl: "https://www.dhl.com/th-en/home/tracking.html?tracking-id={TRACKING}",
      contactEmail: "customer.service@dhl.com",
      contactPhone: "02-345-5000",
    },
    {
      name: "J&T Express",
      code: "JT",
      status: CarrierStatus.ACTIVE,
      trackingUrl: "https://www.jtexpress.co.th/index/query/gzquery.html?bills={TRACKING}",
      contactEmail: "service.th@jtexpress.com",
      contactPhone: "02-033-3900",
    },
  ];

  console.log("🚚 Seeding carriers...");
  for (const carrier of carriers) {
    await prisma.carrier.upsert({
      where: { code: carrier.code },
      update: {},
      create: carrier,
    });
    console.log(`  ✓ ${carrier.name}`);
  }
}

async function seedShippingZones() {
  const zones = [
    {
      name: "Bangkok Metro",
      description: "กรุงเทพฯ และปริมณฑล",
      regions: {
        provinces: ["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ"],
        postcodes: ["10xxx"],
      },
    },
    {
      name: "Central Thailand",
      description: "ภาคกลาง (ยกเว้น กทม.และปริมณฑล)",
      regions: {
        provinces: [
          "อยุธยา", "อ่างทอง", "ชัยนาท", "ลพบุรี", "สระบุรี",
          "สิงห์บุรี", "นครนายก", "สมุทรสาคร", "สมุทรสงคราม",
          "ราชบุรี", "กาญจนบุรี", "สุพรรณบุรี", "นครปฐม", "เพชรบุรี",
          "ประจวบคีรีขันธ์",
        ],
      },
    },
    {
      name: "Northern Thailand",
      description: "ภาคเหนือ",
      regions: {
        provinces: [
          "เชียงใหม่", "เชียงราย", "พะเยา", "แพร่", "น่าน",
          "ลำปาง", "ลำพูน", "แม่ฮ่องสอน", "อุตรดิตถ์", "สุโขทัย",
          "พิษณุโลก", "พิจิตร", "กำแพงเพชร", "ตาก", "เพชรบูรณ์",
          "นครสวรรค์", "อุทัยธานี",
        ],
      },
    },
    {
      name: "Northeastern Thailand",
      description: "ภาคตะวันออกเฉียงเหนือ (อีสาน)",
      regions: {
        provinces: [
          "นครราชสีมา", "ขอนแก่น", "อุดรธานี", "อุบลราชธานี",
          "บึงกาฬ", "เลย", "หนองบัวลำภู", "หนองคาย", "สกลนคร",
          "นครพนม", "มุกดาหาร", "กาฬสินธุ์", "มหาสารคาม", "ร้อยเอ็ด",
          "ยโสธร", "อำนาจเจริญ", "ศรีสะเกษ", "สุรินทร์", "บุรีรัมย์",
          "ชัยภูมิ",
        ],
      },
    },
    {
      name: "Eastern Thailand",
      description: "ภาคตะวันออก",
      regions: {
        provinces: [
          "ชลบุรี", "ระยอง", "จันทบุรี", "ตราด", "ฉะเชิงเทรา",
          "ปราจีนบุรี", "สระแก้ว",
        ],
      },
    },
    {
      name: "Southern Thailand",
      description: "ภาคใต้",
      regions: {
        provinces: [
          "สุราษฎร์ธานี", "นครศรีธรรมราช", "กระบี่", "พังงา",
          "ภูเก็ต", "ตรัง", "พัทลุง", "สงขลา", "ชุมพร", "ระนอง",
          "สตูล", "ปัตตานี", "ยะลา", "นราธิวาส",
        ],
      },
    },
    {
      name: "International",
      description: "ต่างประเทศทั่วโลก",
      regions: {
        description: "All international destinations",
        countries: ["ALL"],
      },
    },
  ];

  console.log("🗺️  Seeding shipping zones...");
  for (const zone of zones) {
    await prisma.shippingZone.upsert({
      where: { name: zone.name },
      update: {},
      create: zone,
    });
    console.log(`  ✓ ${zone.name}`);
  }
}

async function seedShippingRates() {
  console.log("💰 Seeding shipping rates...");

  const kerry = await prisma.carrier.findUnique({ where: { code: "KERRY" } });
  const flash = await prisma.carrier.findUnique({ where: { code: "FLASH" } });
  const thpost = await prisma.carrier.findUnique({ where: { code: "THPOST" } });

  const bangkokZone = await prisma.shippingZone.findUnique({ where: { name: "Bangkok Metro" } });
  const centralZone = await prisma.shippingZone.findUnique({ where: { name: "Central Thailand" } });
  const northZone = await prisma.shippingZone.findUnique({ where: { name: "Northern Thailand" } });
  const northeastZone = await prisma.shippingZone.findUnique({ where: { name: "Northeastern Thailand" } });
  const eastZone = await prisma.shippingZone.findUnique({ where: { name: "Eastern Thailand" } });
  const southZone = await prisma.shippingZone.findUnique({ where: { name: "Southern Thailand" } });

  if (!kerry || !flash || !thpost || !bangkokZone || !centralZone || !northZone || !northeastZone || !eastZone || !southZone) {
    console.log("  ⚠️  Missing carriers or zones, skipping rates");
    return;
  }

  type RateInput = {
    carrierId: string;
    zoneId: string;
    serviceName: string;
    baseRate: number;
    perKgRate: number;
    minWeightKg: number;
    estimatedDays: number;
  };

  const rates: RateInput[] = [
    // Kerry Express
    { carrierId: kerry.id, zoneId: bangkokZone.id, serviceName: "Standard", baseRate: 35, perKgRate: 8, minWeightKg: 0, estimatedDays: 1 },
    { carrierId: kerry.id, zoneId: centralZone.id, serviceName: "Standard", baseRate: 45, perKgRate: 10, minWeightKg: 0, estimatedDays: 2 },
    { carrierId: kerry.id, zoneId: northZone.id, serviceName: "Standard", baseRate: 55, perKgRate: 12, minWeightKg: 0, estimatedDays: 3 },
    { carrierId: kerry.id, zoneId: northeastZone.id, serviceName: "Standard", baseRate: 55, perKgRate: 12, minWeightKg: 0, estimatedDays: 3 },
    { carrierId: kerry.id, zoneId: eastZone.id, serviceName: "Standard", baseRate: 45, perKgRate: 10, minWeightKg: 0, estimatedDays: 2 },
    { carrierId: kerry.id, zoneId: southZone.id, serviceName: "Standard", baseRate: 60, perKgRate: 14, minWeightKg: 0, estimatedDays: 3 },
    // Flash Express
    { carrierId: flash.id, zoneId: bangkokZone.id, serviceName: "Standard", baseRate: 30, perKgRate: 7, minWeightKg: 0, estimatedDays: 1 },
    { carrierId: flash.id, zoneId: centralZone.id, serviceName: "Standard", baseRate: 40, perKgRate: 9, minWeightKg: 0, estimatedDays: 2 },
    { carrierId: flash.id, zoneId: northZone.id, serviceName: "Standard", baseRate: 50, perKgRate: 11, minWeightKg: 0, estimatedDays: 3 },
    { carrierId: flash.id, zoneId: northeastZone.id, serviceName: "Standard", baseRate: 50, perKgRate: 11, minWeightKg: 0, estimatedDays: 3 },
    { carrierId: flash.id, zoneId: eastZone.id, serviceName: "Standard", baseRate: 40, perKgRate: 9, minWeightKg: 0, estimatedDays: 2 },
    { carrierId: flash.id, zoneId: southZone.id, serviceName: "Standard", baseRate: 55, perKgRate: 13, minWeightKg: 0, estimatedDays: 3 },
    // Thailand Post
    { carrierId: thpost.id, zoneId: bangkokZone.id, serviceName: "Standard", baseRate: 25, perKgRate: 5, minWeightKg: 0, estimatedDays: 2 },
    { carrierId: thpost.id, zoneId: centralZone.id, serviceName: "Standard", baseRate: 30, perKgRate: 6, minWeightKg: 0, estimatedDays: 3 },
    { carrierId: thpost.id, zoneId: northZone.id, serviceName: "Standard", baseRate: 35, perKgRate: 8, minWeightKg: 0, estimatedDays: 5 },
    { carrierId: thpost.id, zoneId: northeastZone.id, serviceName: "Standard", baseRate: 35, perKgRate: 8, minWeightKg: 0, estimatedDays: 5 },
    { carrierId: thpost.id, zoneId: eastZone.id, serviceName: "Standard", baseRate: 30, perKgRate: 6, minWeightKg: 0, estimatedDays: 3 },
    { carrierId: thpost.id, zoneId: southZone.id, serviceName: "Standard", baseRate: 40, perKgRate: 9, minWeightKg: 0, estimatedDays: 5 },
  ];

  let created = 0;
  for (const rate of rates) {
    const existing = await prisma.shippingRate.findFirst({
      where: { carrierId: rate.carrierId, zoneId: rate.zoneId, serviceName: rate.serviceName },
    });
    if (!existing) {
      await prisma.shippingRate.create({ data: rate });
      created++;
    }
  }
  console.log(`  ✓ Created ${created} shipping rates (${rates.length - created} already existed)`);
}

async function main() {
  console.log("🌱 Starting Phase 17 seed...\n");

  await seedCarriers();
  await seedShippingZones();
  await seedShippingRates();

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
