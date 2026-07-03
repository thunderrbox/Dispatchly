import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { withAuth } from '../../../../lib/rbac';
import { OrderStatus } from '@prisma/client';

// GET /api/admin/dashboard - Fetch metrics for the admin dashboard (ADMIN only)
async function getHandler(request: NextRequest) {
  try {
    // 1. Fetch total orders count and group by status
    const statusGroups = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const statusCounts: Record<OrderStatus, number> = {
      CREATED: 0,
      PICKED_UP: 0,
      IN_TRANSIT: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      FAILED: 0,
      RESCHEDULED: 0,
      NEW_AGENT_ASSIGNED: 0,
    };

    statusGroups.forEach((g) => {
      statusCounts[g.status] = g._count.id;
    });

    // 2. Fetch unassigned orders count (status CREATED and no agent assigned)
    const unassignedCount = await prisma.order.count({
      where: {
        status: 'CREATED',
        assignedAgentId: null,
      },
    });

    // 3. Fetch agents metrics
    const totalAgents = await prisma.deliveryAgent.count();
    const availableAgents = await prisma.deliveryAgent.count({
      where: { available: true },
    });

    // 4. Fetch recent 20 orders
    const recentOrders = await prisma.order.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        pickupZone: { select: { name: true } },
        dropZone: { select: { name: true } },
        assignedAgent: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    // 5. Fetch orders by zone breakdown (pickup zones count)
    const pickupZoneGroups = await prisma.order.groupBy({
      by: ['pickupZoneId'],
      _count: {
        id: true,
      },
    });

    // Resolve zone names
    const zoneIds = pickupZoneGroups.map((g) => g.pickupZoneId);
    const zones = await prisma.zone.findMany({
      where: { id: { in: zoneIds } },
      select: { id: true, name: true },
    });

    const zoneBreakdown = pickupZoneGroups.map((g) => {
      const zoneObj = zones.find((z) => z.id === g.pickupZoneId);
      return {
        zoneName: zoneObj ? zoneObj.name : 'Unknown',
        count: g._count.id,
      };
    });

    const dashboardMetrics = {
      statusCounts,
      unassignedCount,
      agentsSummary: {
        total: totalAgents,
        available: availableAgents,
        busy: totalAgents - availableAgents,
      },
      recentOrders,
      zoneBreakdown,
    };

    return NextResponse.json(dashboardMetrics, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(['ADMIN'], getHandler);
