import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { withAuth } from '../../../../../lib/rbac';

// PATCH /api/agents/:id/availability - Toggle agent availability & location (AGENT self only)
async function patchHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; user: { userId: string; role: any } }
) {
  try {
    const params = await context.params;
    const agentId = params.id;
    const { userId, role } = context.user;
    const body = await request.json();

    // Find agent profile
    const agent = await prisma.deliveryAgent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Delivery agent profile not found' }, { status: 404 });
    }

    // Verify self-ownership unless user is Admin (Admins can manage agents too)
    if (role !== 'ADMIN' && agent.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own profile' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (typeof body.available === 'boolean') {
      updateData.available = body.available;
    }
    if (typeof body.currentLatitude === 'number') {
      updateData.currentLatitude = body.currentLatitude;
    }
    if (typeof body.currentLongitude === 'number') {
      updateData.currentLongitude = body.currentLongitude;
    }

    const updatedAgent = await prisma.deliveryAgent.update({
      where: { id: agentId },
      data: updateData,
    });

    return NextResponse.json(updatedAgent, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update availability' },
      { status: 400 }
    );
  }
}

export const PATCH = withAuth(['AGENT', 'ADMIN'], patchHandler);
