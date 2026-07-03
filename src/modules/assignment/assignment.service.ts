import prisma from '../../lib/prisma';

// Helper: Haversine distance in km
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Static coordinate map representing area coordinates
const AREA_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Manhattan': { lat: 40.7831, lon: -73.9712 },
  'Brooklyn': { lat: 40.6782, lon: -73.9442 },
  'Queens': { lat: 40.7282, lon: -73.7949 },
  'Zone A Area 1': { lat: 40.7589, lon: -73.9851 }, // Times Square
  'Zone B Area 1': { lat: 40.6263, lon: -74.0271 }, // Bay Ridge
  'Zone C Area 1': { lat: 40.7420, lon: -73.8480 }, // Flushing Meadows
};

export function getAreaCoordinates(areaName: string): { lat: number; lon: number } {
  return AREA_COORDINATES[areaName] || { lat: 40.7128, lon: -74.0060 }; // NYC default
}

export async function manualAssign(orderId: string, agentId: string, adminUserId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error('Order not found');
  if (order.status !== 'CREATED') {
    throw new Error(`Cannot assign agent: Order is in "${order.status}" status (must be CREATED)`);
  }

  const agent = await prisma.deliveryAgent.findUnique({
    where: { id: agentId },
  });

  if (!agent) throw new Error('Delivery agent not found');
  if (!agent.available) {
    throw new Error('Delivery agent is currently marked as unavailable');
  }

  return await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        assignedAgentId: agentId,
      },
    });

    await tx.trackingEvent.create({
      data: {
        orderId,
        oldStatus: order.status,
        newStatus: order.status, // Remains CREATED, but tracking who assigned the agent
        changedByUserId: adminUserId,
        isOverride: false,
      },
    });

    return updatedOrder;
  });
}

export async function autoAssign(orderId: string, adminUserId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      pickupZone: {
        include: {
          areas: true,
        },
      },
    },
  });

  if (!order) throw new Error('Order not found');
  if (order.status !== 'CREATED') {
    throw new Error(`Cannot auto-assign agent: Order is in "${order.status}" status (must be CREATED)`);
  }

  // Find all available agents
  const availableAgents = await prisma.deliveryAgent.findMany({
    where: { available: true },
    include: {
      user: { select: { name: true } },
      assignedOrders: {
        where: {
          status: {
            notIn: ['DELIVERED', 'FAILED'],
          },
        },
      },
    },
  });

  if (availableAgents.length === 0) {
    throw new Error('No available delivery agents found at this moment');
  }

  // Get representative pickup coordinate (using first area of the pickup zone, or generic NYC)
  const pickupAreaName = order.pickupZone.areas[0]?.name || '';
  const pickupCoords = getAreaCoordinates(pickupAreaName);

  // Calculate distance & sort with active order tie-break
  const candidates = availableAgents.map((agent) => {
    const distance = haversineDistance(
      agent.currentLatitude,
      agent.currentLongitude,
      pickupCoords.lat,
      pickupCoords.lon
    );
    return {
      agent,
      distance,
      activeOrderCount: agent.assignedOrders.length,
    };
  });

  candidates.sort((a, b) => {
    // 1. Sort by distance ascending
    if (Math.abs(a.distance - b.distance) > 0.01) {
      return a.distance - b.distance;
    }
    // 2. Tie-break: prefer agent with fewest currently-active orders
    return a.activeOrderCount - b.activeOrderCount;
  });

  const bestCandidate = candidates[0];

  return await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        assignedAgentId: bestCandidate.agent.id,
      },
    });

    await tx.trackingEvent.create({
      data: {
        orderId,
        oldStatus: order.status,
        newStatus: order.status,
        changedByUserId: adminUserId,
        isOverride: false,
      },
    });

    return {
      order: updatedOrder,
      assignedAgent: {
        id: bestCandidate.agent.id,
        name: bestCandidate.agent.user.name,
        distanceKm: bestCandidate.distance,
        activeOrders: bestCandidate.activeOrderCount,
      },
    };
  });
}
