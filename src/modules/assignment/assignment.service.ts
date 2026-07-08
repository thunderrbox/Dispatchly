import prisma from '../../lib/prisma';

/**
 * Calculates the geodesic distance between two points on the Earth's surface
 * using the Haversine formula. This provides a straight-line approximation in kilometers.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
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

// Coordinate map representing representative coordinates for Indian localities focused on UP & NCR
const AREA_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Kanpur': { lat: 26.4499, lon: 80.3319 },
  'Barra': { lat: 26.4480, lon: 80.3200 },
  'Kidwai Nagar': { lat: 26.4520, lon: 80.3500 },
  'Lucknow': { lat: 26.8467, lon: 80.9462 },
  'Noida': { lat: 28.5355, lon: 77.3910 },
  'Delhi': { lat: 28.6139, lon: 77.2090 },
  'Gurugram': { lat: 28.4595, lon: 77.0266 },
};

/**
 * Returns representative latitude and longitude for a given locality area.
 * Defaults to Kanpur if area is not registered.
 */
export function getAreaCoordinates(areaName: string): { lat: number; lon: number } {
  return AREA_COORDINATES[areaName] || { lat: 26.4499, lon: 80.3319 }; // Kanpur default
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
