import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database for Dispatchly...');

  // 1. Clean existing records to prevent unique constraints issues on re-run
  await prisma.trackingEvent.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.deliveryAgent.deleteMany({});
  await prisma.rateCard.deleteMany({});
  await prisma.area.deleteMany({});
  await prisma.zone.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Hash passwords
  const adminPassHash = await bcrypt.hash('Admin@123', 10);
  const agentPassHash = await bcrypt.hash('Agent@123', 10);
  const customerPassHash = await bcrypt.hash('Customer@123', 10);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@dispatchly.test',
      passwordHash: adminPassHash,
      role: 'ADMIN',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: 'Alex Johnson',
      email: 'customer1@dispatchly.test',
      passwordHash: customerPassHash,
      role: 'CUSTOMER',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Sophia Smith',
      email: 'customer2@dispatchly.test',
      passwordHash: customerPassHash,
      role: 'CUSTOMER',
    },
  });

  const agentUser1 = await prisma.user.create({
    data: {
      name: 'Courier Bob',
      email: 'agent1@dispatchly.test',
      passwordHash: agentPassHash,
      role: 'AGENT',
    },
  });

  const agentUser2 = await prisma.user.create({
    data: {
      name: 'Courier Sarah',
      email: 'agent2@dispatchly.test',
      passwordHash: agentPassHash,
      role: 'AGENT',
    },
  });

  const agentUser3 = await prisma.user.create({
    data: {
      name: 'Courier David',
      email: 'agent3@dispatchly.test',
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

  const agent3 = await prisma.deliveryAgent.create({
    data: {
      userId: agentUser3.id,
      currentLatitude: 40.7128, // City Center NYC
      currentLongitude: -74.0060,
      available: false, // Offline agent
    },
  });

  // 5. Create Zones & Areas
  const zoneA = await prisma.zone.create({
    data: { name: 'Zone A (Manhattan)' },
  });

  const zoneB = await prisma.zone.create({
    data: { name: 'Zone B (Brooklyn)' },
  });

  const areaA1 = await prisma.area.create({
    data: { name: 'Manhattan', zoneId: zoneA.id },
  });

  const areaA2 = await prisma.area.create({
    data: { name: 'Zone A Area 1', zoneId: zoneA.id },
  });

  const areaB1 = await prisma.area.create({
    data: { name: 'Brooklyn', zoneId: zoneB.id },
  });

  const areaB2 = await prisma.area.create({
    data: { name: 'Zone B Area 1', zoneId: zoneB.id },
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

  // 7. Seed Sample Orders with Mixed Statuses (CREATED, IN_TRANSIT, DELIVERED, FAILED)
  
  // Order 1: CREATED, customer 1, pickup Manhattan, drop Brooklyn (INTER_ZONE B2C PREPAID), unassigned
  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      createdByUserId: customer1.id,
      pickupAddress: '123 Broadway, Manhattan, NY',
      dropAddress: '456 Atlantic Ave, Brooklyn, NY',
      pickupZoneId: zoneA.id,
      dropZoneId: zoneB.id,
      actualWeight: 2.5,
      volumetricWeight: 1.2,
      billableWeight: 2.5,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      finalAmount: 50.0, // 2.5kg * $20/kg (INTER_ZONE B2C)
      status: 'CREATED',
      assignedAgentId: null,
    },
  });

  await prisma.trackingEvent.create({
    data: {
      orderId: order1.id,
      oldStatus: null,
      newStatus: 'CREATED',
      changedByUserId: customer1.id,
    },
  });

  // Order 2: IN_TRANSIT, customer 1, pickup Zone A Area 1, drop Zone A Area 1 (INTRA_ZONE B2B COD), assigned to Agent 1
  const order2 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      createdByUserId: customer1.id,
      pickupAddress: '789 Times Square, Manhattan, NY',
      dropAddress: '101 Central Park West, Manhattan, NY',
      pickupZoneId: zoneA.id,
      dropZoneId: zoneA.id,
      actualWeight: 5.0,
      volumetricWeight: 8.0,
      billableWeight: 8.0, // uses volumetric
      orderType: 'B2B',
      paymentType: 'COD',
      finalAmount: 68.0, // 8.0kg * $8/kg (INTRA_ZONE B2B) + $4 flat COD charge
      status: 'IN_TRANSIT',
      assignedAgentId: agent1.id,
    },
  });

  await prisma.trackingEvent.createMany({
    data: [
      {
        orderId: order2.id,
        oldStatus: null,
        newStatus: 'CREATED',
        changedByUserId: customer1.id,
        timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      },
      {
        orderId: order2.id,
        oldStatus: 'CREATED',
        newStatus: 'PICKED_UP',
        changedByUserId: agentUser1.id,
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        orderId: order2.id,
        oldStatus: 'PICKED_UP',
        newStatus: 'IN_TRANSIT',
        changedByUserId: agentUser1.id,
        timestamp: new Date(),
      },
    ],
  });

  // Order 3: DELIVERED, customer 2, pickup Brooklyn, drop Brooklyn (INTRA_ZONE B2C PREPAID), assigned to Agent 2
  const order3 = await prisma.order.create({
    data: {
      customerId: customer2.id,
      createdByUserId: customer2.id,
      pickupAddress: '11 Flatbush Ave, Brooklyn, NY',
      dropAddress: '22 Bedford Ave, Brooklyn, NY',
      pickupZoneId: zoneB.id,
      dropZoneId: zoneB.id,
      actualWeight: 1.5,
      volumetricWeight: 1.0,
      billableWeight: 1.5,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      finalAmount: 15.0, // 1.5kg * $10/kg (INTRA_ZONE B2C)
      status: 'DELIVERED',
      assignedAgentId: agent2.id,
    },
  });

  await prisma.trackingEvent.createMany({
    data: [
      {
        orderId: order3.id,
        oldStatus: null,
        newStatus: 'CREATED',
        changedByUserId: customer2.id,
        timestamp: new Date(Date.now() - 3600000 * 4),
      },
      {
        orderId: order3.id,
        oldStatus: 'CREATED',
        newStatus: 'PICKED_UP',
        changedByUserId: agentUser2.id,
        timestamp: new Date(Date.now() - 3600000 * 3),
      },
      {
        orderId: order3.id,
        oldStatus: 'PICKED_UP',
        newStatus: 'IN_TRANSIT',
        changedByUserId: agentUser2.id,
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
      {
        orderId: order3.id,
        oldStatus: 'IN_TRANSIT',
        newStatus: 'OUT_FOR_DELIVERY',
        changedByUserId: agentUser2.id,
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        orderId: order3.id,
        oldStatus: 'OUT_FOR_DELIVERY',
        newStatus: 'DELIVERED',
        changedByUserId: agentUser2.id,
        timestamp: new Date(),
      },
    ],
  });

  // Order 4: FAILED, customer 2, pickup Zone A Area 1, drop Zone B Area 1 (INTER_ZONE B2C PREPAID), assigned to Agent 1
  const order4 = await prisma.order.create({
    data: {
      customerId: customer2.id,
      createdByUserId: customer2.id,
      pickupAddress: '555 Broadway, Manhattan, NY',
      dropAddress: '777 Ocean Parkway, Brooklyn, NY',
      pickupZoneId: zoneA.id,
      dropZoneId: zoneB.id,
      actualWeight: 3.0,
      volumetricWeight: 2.0,
      billableWeight: 3.0,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      finalAmount: 60.0, // 3kg * $20/kg (INTER_ZONE B2C)
      status: 'FAILED',
      assignedAgentId: agent1.id,
    },
  });

  await prisma.trackingEvent.createMany({
    data: [
      {
        orderId: order4.id,
        oldStatus: null,
        newStatus: 'CREATED',
        changedByUserId: customer2.id,
        timestamp: new Date(Date.now() - 3600000 * 3),
      },
      {
        orderId: order4.id,
        oldStatus: 'CREATED',
        newStatus: 'PICKED_UP',
        changedByUserId: agentUser1.id,
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
      {
        orderId: order4.id,
        oldStatus: 'PICKED_UP',
        newStatus: 'IN_TRANSIT',
        changedByUserId: agentUser1.id,
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        orderId: order4.id,
        oldStatus: 'IN_TRANSIT',
        newStatus: 'OUT_FOR_DELIVERY',
        changedByUserId: agentUser1.id,
        timestamp: new Date(Date.now() - 1800000), // 30 mins ago
      },
      {
        orderId: order4.id,
        oldStatus: 'OUT_FOR_DELIVERY',
        newStatus: 'FAILED',
        changedByUserId: agentUser1.id,
        timestamp: new Date(),
      },
    ],
  });

  console.log('Seeding completed successfully!');
  console.log('Dispatchly test accounts are ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
