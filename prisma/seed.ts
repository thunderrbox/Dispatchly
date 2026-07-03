import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database for Dispatchly (India / Uttar Pradesh Focus)...');

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

  // 3. Create Users with Indian Names
  const admin = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar',
      email: 'admin@dispatchly.test',
      passwordHash: adminPassHash,
      role: 'ADMIN',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: 'aarav@dispatchly.test',
      passwordHash: customerPassHash,
      role: 'CUSTOMER',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya@dispatchly.test',
      passwordHash: customerPassHash,
      role: 'CUSTOMER',
    },
  });

  const agentUser1 = await prisma.user.create({
    data: {
      name: 'Amit Singh',
      email: 'amit@dispatchly.test',
      passwordHash: agentPassHash,
      role: 'AGENT',
    },
  });

  const agentUser2 = await prisma.user.create({
    data: {
      name: 'Vikram Malhotra',
      email: 'vikram@dispatchly.test',
      passwordHash: agentPassHash,
      role: 'AGENT',
    },
  });

  const agentUser3 = await prisma.user.create({
    data: {
      name: 'Neha Gupta',
      email: 'neha@dispatchly.test',
      passwordHash: agentPassHash,
      role: 'AGENT',
    },
  });

  // 4. Create DeliveryAgent profiles with coordinates
  const agent1 = await prisma.deliveryAgent.create({
    data: {
      userId: agentUser1.id,
      currentLatitude: 26.4499, // Kanpur (Barra region coordinates)
      currentLongitude: 80.3319,
      available: true,
    },
  });

  const agent2 = await prisma.deliveryAgent.create({
    data: {
      userId: agentUser2.id,
      currentLatitude: 26.8467, // Lucknow
      currentLongitude: 80.9462,
      available: true,
    },
  });

  const agent3 = await prisma.deliveryAgent.create({
    data: {
      userId: agentUser3.id,
      currentLatitude: 28.5355, // Noida
      currentLongitude: 77.3910,
      available: false, // Offline agent
    },
  });

  // 5. Create Indian Zones (UP and NCR)
  const zoneUP = await prisma.zone.create({
    data: { name: 'Uttar Pradesh (UP)' },
  });

  const zoneNCR = await prisma.zone.create({
    data: { name: 'National Capital Region (NCR)' },
  });

  // 6. Areas under UP and NCR
  const areaUP1 = await prisma.area.create({
    data: { name: 'Kanpur', zoneId: zoneUP.id },
  });

  const areaUP2 = await prisma.area.create({
    data: { name: 'Barra', zoneId: zoneUP.id },
  });

  const areaUP3 = await prisma.area.create({
    data: { name: 'Kidwai Nagar', zoneId: zoneUP.id },
  });

  const areaUP4 = await prisma.area.create({
    data: { name: 'Lucknow', zoneId: zoneUP.id },
  });

  const areaNCR1 = await prisma.area.create({
    data: { name: 'Noida', zoneId: zoneNCR.id },
  });

  const areaNCR2 = await prisma.area.create({
    data: { name: 'Delhi', zoneId: zoneNCR.id },
  });

  const areaNCR3 = await prisma.area.create({
    data: { name: 'Gurugram', zoneId: zoneNCR.id },
  });

  // 7. Create Rate Cards (B2B/B2C × INTRA_ZONE/INTER_ZONE) in Rupees / INR
  await prisma.rateCard.createMany({
    data: [
      {
        orderType: 'B2C',
        zoneType: 'INTRA_ZONE',
        pricePerKg: 40.0, // Rs. 40 per kg
        codCharge: 20.0, // Rs. 20 COD charge
        isActive: true,
      },
      {
        orderType: 'B2C',
        zoneType: 'INTER_ZONE',
        pricePerKg: 80.0, // Rs. 80 per kg
        codCharge: 30.0,
        isActive: true,
      },
      {
        orderType: 'B2B',
        zoneType: 'INTRA_ZONE',
        pricePerKg: 30.0,
        codCharge: 15.0,
        isActive: true,
      },
      {
        orderType: 'B2B',
        zoneType: 'INTER_ZONE',
        pricePerKg: 60.0,
        codCharge: 25.0,
        isActive: true,
      },
    ],
  });

  // 8. Seed Sample Indian Orders with Mixed Statuses (CREATED, IN_TRANSIT, DELIVERED, FAILED)
  
  // Order 1: CREATED, Aarav Sharma, pickup Barra (Kanpur), drop Kidwai Nagar (Kanpur) - INTRA_ZONE B2C PREPAID
  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      createdByUserId: customer1.id,
      pickupAddress: 'House 42, Sector 3, Barra, Kanpur, UP',
      dropAddress: 'Plot 105, Block C, Kidwai Nagar, Kanpur, UP',
      pickupZoneId: zoneUP.id,
      dropZoneId: zoneUP.id,
      actualWeight: 2.5,
      volumetricWeight: 1.2,
      billableWeight: 2.5,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      finalAmount: 100.0, // 2.5kg * Rs. 40/kg
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

  // Order 2: IN_TRANSIT, Aarav Sharma, pickup Lucknow, drop Noida - INTER_ZONE B2B COD, assigned to Amit
  const order2 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      createdByUserId: customer1.id,
      pickupAddress: 'Hazratganj Crossing, Lucknow, UP',
      dropAddress: 'Sector 62, Metro Depot, Noida, UP',
      pickupZoneId: zoneUP.id,
      dropZoneId: zoneNCR.id,
      actualWeight: 5.0,
      volumetricWeight: 8.0,
      billableWeight: 8.0, // uses volumetric
      orderType: 'B2B',
      paymentType: 'COD',
      finalAmount: 505.0, // 8kg * Rs. 60/kg (INTER_ZONE B2B) + Rs. 25 COD
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
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
      {
        orderId: order2.id,
        oldStatus: 'CREATED',
        newStatus: 'PICKED_UP',
        changedByUserId: agentUser1.id,
        timestamp: new Date(Date.now() - 3600000),
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

  // Order 3: DELIVERED, Priya Patel, pickup Delhi, drop Gurugram - INTRA_ZONE B2C PREPAID, assigned to Vikram
  const order3 = await prisma.order.create({
    data: {
      customerId: customer2.id,
      createdByUserId: customer2.id,
      pickupAddress: 'Connaught Place, New Delhi, NCR',
      dropAddress: 'Cyber City, Phase 3, Gurugram, NCR',
      pickupZoneId: zoneNCR.id,
      dropZoneId: zoneNCR.id,
      actualWeight: 1.5,
      volumetricWeight: 1.0,
      billableWeight: 1.5,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      finalAmount: 60.0, // 1.5kg * Rs. 40/kg
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

  // Order 4: FAILED, Priya Patel, pickup Barra, drop Noida - INTER_ZONE B2C PREPAID, assigned to Amit
  const order4 = await prisma.order.create({
    data: {
      customerId: customer2.id,
      createdByUserId: customer2.id,
      pickupAddress: 'Barra Bypass, Kanpur, UP',
      dropAddress: 'Sector 15 Metro Lane, Noida, UP',
      pickupZoneId: zoneUP.id,
      dropZoneId: zoneNCR.id,
      actualWeight: 3.0,
      volumetricWeight: 2.0,
      billableWeight: 3.0,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      finalAmount: 240.0, // 3kg * Rs. 80/kg
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
        timestamp: new Date(Date.now() - 1800000),
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

  console.log('Seeding completed successfully with Indian credentials!');
  console.log('Admin: admin@dispatchly.test / Admin@123');
  console.log('Customer: aarav@dispatchly.test / Customer@123');
  console.log('Agent: amit@dispatchly.test / Agent@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
