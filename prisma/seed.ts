import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records to prevent unique constraints issues on re-run
  await prisma.trackingEvent.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.deliveryAgent.deleteMany({});
  await prisma.rateCard.deleteMany({});
  await prisma.area.deleteMany({});
  await prisma.zone.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Hash passwords
  const adminPassHash = await bcrypt.hash('admin123', 10);
  const agentPassHash = await bcrypt.hash('agent123', 10);
  const customerPassHash = await bcrypt.hash('customer123', 10);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@daffodil.com',
      passwordHash: adminPassHash,
      role: 'ADMIN',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: 'Alex Johnson',
      email: 'customer1@daffodil.com',
      passwordHash: customerPassHash,
      role: 'CUSTOMER',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Sophia Smith',
      email: 'customer2@daffodil.com',
      passwordHash: customerPassHash,
      role: 'CUSTOMER',
    },
  });

  const agentUser1 = await prisma.user.create({
    data: {
      name: 'Courier Bob',
      email: 'agent1@daffodil.com',
      passwordHash: agentPassHash,
      role: 'AGENT',
    },
  });

  const agentUser2 = await prisma.user.create({
    data: {
      name: 'Courier Sarah',
      email: 'agent2@daffodil.com',
      passwordHash: agentPassHash,
      role: 'AGENT',
    },
  });

  // 4. Create DeliveryAgent profiles
  const agent1 = await prisma.deliveryAgent.create({
    data: {
      userId: agentUser1.id,
      currentLatitude: 40.7589, // NYC Times Square (Zone A Area 1)
      currentLongitude: -73.9851,
      available: true,
    },
  });

  const agent2 = await prisma.deliveryAgent.create({
    data: {
      userId: agentUser2.id,
      currentLatitude: 40.6263, // Bay Ridge Brooklyn (Zone B Area 1)
      currentLongitude: -74.0271,
      available: true,
    },
  });

  // 5. Create Zones & Areas
  const zoneA = await prisma.zone.create({
    data: { name: 'Zone A (Manhattan)' },
  });

  const zoneB = await prisma.zone.create({
    data: { name: 'Zone B (Brooklyn)' },
  });

  const zoneC = await prisma.zone.create({
    data: { name: 'Zone C (Queens)' },
  });

  await prisma.area.createMany({
    data: [
      { name: 'Manhattan', zoneId: zoneA.id },
      { name: 'Zone A Area 1', zoneId: zoneA.id },
      { name: 'Brooklyn', zoneId: zoneB.id },
      { name: 'Zone B Area 1', zoneId: zoneB.id },
      { name: 'Queens', zoneId: zoneC.id },
      { name: 'Zone C Area 1', zoneId: zoneC.id },
    ],
  });

  // 6. Create Rate Cards (B2B/B2C × INTRA_ZONE/INTER_ZONE)
  await prisma.rateCard.createMany({
    data: [
      {
        orderType: 'B2C',
        zoneType: 'INTRA_ZONE',
        pricePerKg: 10.0,
        codCharge: 5.0,
        isActive: true,
      },
      {
        orderType: 'B2C',
        zoneType: 'INTER_ZONE',
        pricePerKg: 20.0,
        codCharge: 8.0,
        isActive: true,
      },
      {
        orderType: 'B2B',
        zoneType: 'INTRA_ZONE',
        pricePerKg: 8.0,
        codCharge: 4.0,
        isActive: true,
      },
      {
        orderType: 'B2B',
        zoneType: 'INTER_ZONE',
        pricePerKg: 15.0,
        codCharge: 6.0,
        isActive: true,
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
