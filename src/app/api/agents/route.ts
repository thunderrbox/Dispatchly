import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { withAuth } from '../../../lib/rbac';

// GET /api/agents - List all delivery agents with active order load (ADMIN only)
async function getHandler(request: NextRequest) {
  try {
    const agents = await prisma.deliveryAgent.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        assignedOrders: {
          where: {
            status: {
              notIn: ['DELIVERED', 'FAILED'],
            },
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });

    const formatted = agents.map((agent) => ({
      id: agent.id,
      userId: agent.userId,
      name: agent.user.name,
      email: agent.user.email,
      currentLatitude: agent.currentLatitude,
      currentLongitude: agent.currentLongitude,
      available: agent.available,
      activeOrderCount: agent.assignedOrders.length,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to list delivery agents' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(['ADMIN'], getHandler);
