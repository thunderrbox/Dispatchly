import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { withAuth } from '../../../../../lib/rbac';

// GET /api/orders/:id/tracking - Fetch tracking events for an order (role-scoped RBAC)
async function getHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; user: { userId: string; role: any } }
) {
  try {
    const params = await context.params;
    const orderId = params.id;
    const { userId, role } = context.user;

    // Fetch order first to verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        assignedAgent: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Role-based restrictions check
    if (role === 'CUSTOMER' && order.customerId !== userId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this order' }, { status: 403 });
    }

    if (role === 'AGENT' && (!order.assignedAgent || order.assignedAgent.userId !== userId)) {
      return NextResponse.json(
        { error: 'Forbidden: This order is not assigned to you' },
        { status: 403 }
      );
    }

    const events = await prisma.trackingEvent.findMany({
      where: { orderId },
      include: {
        changedByUser: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json(events, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tracking history' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(['CUSTOMER', 'AGENT', 'ADMIN'], getHandler);
