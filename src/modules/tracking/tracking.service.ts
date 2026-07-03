import prisma from '../../lib/prisma';
import { OrderStatus } from '@prisma/client';
import { sendStatusChangeEmail } from '../notification/notification.service';

// Define valid state machine transitions as per §6
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['PICKED_UP'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  FAILED: ['RESCHEDULED'],
  RESCHEDULED: ['NEW_AGENT_ASSIGNED'],
  NEW_AGENT_ASSIGNED: ['OUT_FOR_DELIVERY'],
  DELIVERED: [], // Terminal state
};

export async function updateStatus(
  orderId: string,
  newStatus: OrderStatus,
  changedByUserId: string,
  userRole: 'CUSTOMER' | 'AGENT' | 'ADMIN'
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      assignedAgent: true,
    },
  });

  if (!order) throw new Error('Order not found');

  const oldStatus = order.status;

  // Enforce access control and state machine constraints
  let isOverride = false;

  if (userRole === 'AGENT') {
    // 1. Verify agent is the one assigned
    if (!order.assignedAgent || order.assignedAgent.userId !== changedByUserId) {
      throw new Error('Forbidden: You are not the courier assigned to this shipment');
    }

    // 2. Enforce state machine transitions
    const allowedNext = VALID_TRANSITIONS[oldStatus];
    if (!allowedNext || !allowedNext.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: Cannot change status from "${oldStatus}" to "${newStatus}"`
      );
    }
  } else if (userRole === 'ADMIN') {
    // Admins can transition to any status (Admin override)
    // If the transition is not in the normal path, mark as override
    const allowedNext = VALID_TRANSITIONS[oldStatus];
    if (!allowedNext || !allowedNext.includes(newStatus)) {
      isOverride = true;
    }
  } else {
    // CUSTOMER role cannot change status directly via status endpoint
    throw new Error('Forbidden: Customers cannot update status directly');
  }

  // Perform update in a transaction
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
      },
    });

    await tx.trackingEvent.create({
      data: {
        orderId,
        oldStatus,
        newStatus,
        changedByUserId,
        isOverride,
      },
    });

    return updatedOrder;
  });

  // Trigger best-effort email notification
  try {
    const customer = await prisma.user.findUnique({
      where: { id: order.customerId },
      select: { email: true, name: true },
    });
    if (customer) {
      sendStatusChangeEmail(orderId, oldStatus, newStatus, customer.email, customer.name);
    }
  } catch (err) {
    console.error('Failed to trigger email notification:', err);
  }

  return updatedOrder;
}

export async function rescheduleOrder(
  orderId: string,
  rescheduleDateStr: string,
  userId: string,
  userRole: 'CUSTOMER' | 'AGENT' | 'ADMIN'
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error('Order not found');

  // Enforce that only CUSTOMER owner or ADMIN can reschedule
  if (userRole === 'CUSTOMER' && order.customerId !== userId) {
    throw new Error('Forbidden: You cannot reschedule an order you do not own');
  } else if (userRole === 'AGENT') {
    throw new Error('Forbidden: Couriers cannot reschedule shipments');
  }

  // Order status must be FAILED
  if (order.status !== 'FAILED') {
    throw new Error(`Cannot reschedule order: Status must be FAILED (current: "${order.status}")`);
  }

  // Reschedule date must be in the future
  const rescheduleDate = new Date(rescheduleDateStr);
  if (isNaN(rescheduleDate.getTime())) {
    throw new Error('Invalid reschedule date format');
  }

  if (rescheduleDate <= new Date()) {
    throw new Error('Reschedule date must be set in the future');
  }

  // Update order: status to RESCHEDULED, clear assigned agent so it goes back to pool
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'RESCHEDULED',
        assignedAgentId: null, // Ready for re-assignment
      },
    });

    await tx.trackingEvent.create({
      data: {
        orderId,
        oldStatus: 'FAILED',
        newStatus: 'RESCHEDULED',
        changedByUserId: userId,
        isOverride: false,
      },
    });

    return updatedOrder;
  });

  // Trigger best-effort email notification for reschedule
  try {
    const customer = await prisma.user.findUnique({
      where: { id: order.customerId },
      select: { email: true, name: true },
    });
    if (customer) {
      sendStatusChangeEmail(orderId, 'FAILED', 'RESCHEDULED', customer.email, customer.name);
    }
  } catch (err) {
    console.error('Failed to trigger email notification for reschedule:', err);
  }

  return updatedOrder;
}
