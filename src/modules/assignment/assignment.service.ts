import prisma from '../../lib/prisma';

/**
 * Calculates the geodesic distance between two points on the Earth's surface
 * using the Haversine formula. This provides a straight-line approximation in kilometers.
 * 
 * @param lat1 Latitude of point 1 (degrees)
 * @param lon1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lon2 Longitude of point 2 (degrees)
 * @returns Geodesic distance in kilometers
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180; // Convert latitude difference from degrees to radians
  const dLon = ((lon2 - lon1) * Math.PI) / 180; // Convert longitude difference from degrees to radians
  
  // Trigonometric term representing half the chord length squared between points
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  // Angular distance in radians computed via atan2 for numerical stability
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Compute final distance in kilometers by multiplying angular distance by Earth radius R
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
 * Defaults to Kanpur coordinates if the area is not explicitly registered in lookup map.
 */
export function getAreaCoordinates(areaName: string): { lat: number; lon: number } {
  return AREA_COORDINATES[areaName] || { lat: 26.4499, lon: 80.3319 }; // Kanpur default fallback
}

/**
 * Manually assigns a specific courier agent to an order.
 * Validates that order is in 'CREATED' status and agent is online/available.
 */
export async function manualAssign(orderId: string, agentId: string, adminUserId: string) {
  // 1. Fetch order from database by unique ID
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error('Order not found');
  if (order.status !== 'CREATED') {
    throw new Error(`Cannot assign agent: Order is in "${order.status}" status (must be CREATED)`);
  }

  // 2. Fetch agent profile from database by unique ID
  const agent = await prisma.deliveryAgent.findUnique({
    where: { id: agentId },
  });

  if (!agent) throw new Error('Delivery agent not found');
  if (!agent.available) {
    throw new Error('Delivery agent is currently marked as unavailable');
  }

  // 3. Atomically update order and insert tracking event log inside Prisma transaction
  return await prisma.$transaction(async (tx) => {
    // Update order with assigned courier agent ID
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        assignedAgentId: agentId,
      },
    });

    // Record tracking audit event in TrackingEvent history table
    await tx.trackingEvent.create({
      data: {
        orderId,
        oldStatus: order.status,
        newStatus: order.status,
        changedByUserId: adminUserId,
        isOverride: false,
      },
    });

    return updatedOrder;
  });
}

/**
 * Automatically dispatches the closest available courier agent using Haversine distance.
 * Applies workload tie-breaking to select driver with fewest active orders if distances are equal.
 */
export async function autoAssign(orderId: string, adminUserId: string) {
  // 1. Retrieve order details and associated pickup zone areas from database
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

  // 2. Fetch all online delivery agents who are currently marked available
  const availableAgents = await prisma.deliveryAgent.findMany({
    where: { available: true },
    include: {
      user: { select: { name: true } },
      assignedOrders: {
        where: {
          status: {
            notIn: ['DELIVERED', 'FAILED'], // Count active non-terminal delivery workloads
          },
        },
      },
    },
  });

  if (availableAgents.length === 0) {
    throw new Error('No available delivery agents found at this moment');
  }

  // 3. Resolve representative GPS coordinates for pickup area
  const pickupAreaName = order.pickupZone.areas[0]?.name || '';
  const pickupCoords = getAreaCoordinates(pickupAreaName);

  // 4. Calculate Haversine straight-line distance for each candidate courier
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

  // 5. Sort candidates: Primary criterion = distance ascending; Secondary tie-break = active order count ascending
  candidates.sort((a, b) => {
    // Primary distance check
    if (Math.abs(a.distance - b.distance) > 0.01) {
      return a.distance - b.distance;
    }
    // Secondary tie-breaker: select agent with fewest active delivery orders to balance driver workload
    return a.activeOrderCount - b.activeOrderCount;
  });

  // 6. Select the top candidate driver
  const bestCandidate = candidates[0];

  // 7. Execute atomic database update transaction
  return await prisma.$transaction(async (tx) => {
    // Update order with selected courier agent ID
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        assignedAgentId: bestCandidate.agent.id,
      },
    });

    // Create immutable audit tracking log entry
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
