import prisma from '../../lib/prisma';
import { CreateOrderSchema } from './order.validation';
import { calculateRate } from '../rate/rate.service';
import { z } from 'zod';

type CreateOrderInput = z.infer<typeof CreateOrderSchema> & {
  createdByUserId: string;
  customerId: string; // Enforce customerId resolved from either route session or explicit param
};

export async function createOrder(input: CreateOrderInput) {
  const parsed = CreateOrderSchema.parse(input);

  // 1. Resolve Areas to Zone IDs
  const pickupArea = await prisma.area.findUnique({
    where: { name: parsed.pickupAreaName },
  });
  if (!pickupArea) {
    throw new Error(`Pickup area "${parsed.pickupAreaName}" is not registered in the system`);
  }

  const dropArea = await prisma.area.findUnique({
    where: { name: parsed.dropAreaName },
  });
  if (!dropArea) {
    throw new Error(`Drop area "${parsed.dropAreaName}" is not registered in the system`);
  }

  // 2. Call rate engine to calculate weight and final billing amount
  const rateResult = await calculateRate({
    actualWeight: parsed.actualWeight,
    lengthCm: parsed.lengthCm,
    widthCm: parsed.widthCm,
    heightCm: parsed.heightCm,
    orderType: parsed.orderType,
    pickupZoneId: pickupArea.zoneId,
    dropZoneId: dropArea.zoneId,
    paymentType: parsed.paymentType,
  });

  // 3. Create order and initial tracking event in a transaction
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerId: input.customerId,
        createdByUserId: input.createdByUserId,
        pickupAddress: parsed.pickupAddress,
        dropAddress: parsed.dropAddress,
        pickupZoneId: pickupArea.zoneId,
        dropZoneId: dropArea.zoneId,
        actualWeight: parsed.actualWeight,
        volumetricWeight: rateResult.volumetricWeight,
        billableWeight: rateResult.billableWeight,
        orderType: parsed.orderType,
        paymentType: parsed.paymentType,
        finalAmount: rateResult.finalAmount,
        status: 'CREATED',
        assignedAgentId: null,
      },
    });

    await tx.trackingEvent.create({
      data: {
        orderId: order.id,
        oldStatus: null,
        newStatus: 'CREATED',
        changedByUserId: input.createdByUserId,
        isOverride: false,
      },
    });

    return order;
  });
}

export async function listOrders(userId: string, role: 'CUSTOMER' | 'AGENT' | 'ADMIN') {
  if (role === 'ADMIN') {
    return await prisma.order.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignedAgent: { include: { user: { select: { name: true } } } },
        pickupZone: true,
        dropZone: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (role === 'AGENT') {
    return await prisma.order.findMany({
      where: {
        assignedAgent: {
          userId: userId,
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        pickupZone: true,
        dropZone: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // CUSTOMER role
  return await prisma.order.findMany({
    where: { customerId: userId },
    include: {
      assignedAgent: { include: { user: { select: { name: true } } } },
      pickupZone: true,
      dropZone: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrder(orderId: string, userId: string, role: 'CUSTOMER' | 'AGENT' | 'ADMIN') {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      assignedAgent: { include: { user: { select: { name: true, email: true } } } },
      pickupZone: true,
      dropZone: true,
      trackingEvents: {
        include: {
          changedByUser: { select: { name: true, role: true } },
        },
        orderBy: { timestamp: 'asc' },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Enforce role-based boundaries on read
  if (role === 'CUSTOMER' && order.customerId !== userId) {
    throw new Error('Forbidden: You do not own this order');
  }

  if (role === 'AGENT' && order.assignedAgent?.userId !== userId) {
    throw new Error('Forbidden: This order is not assigned to you');
  }

  return order;
}
