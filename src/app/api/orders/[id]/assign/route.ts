import { NextRequest, NextResponse } from 'next/server';
import { manualAssign } from '../../../../../modules/assignment/assignment.service';
import { withAuth } from '../../../../../lib/rbac';

// POST /api/orders/:id/assign - Manually assign an agent to an order (ADMIN only)
async function postHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; user: { userId: string } }
) {
  try {
    const params = await context.params;
    const orderId = params.id;
    const { userId: adminUserId } = context.user;
    const body = await request.json();

    if (!body.agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    const order = await manualAssign(orderId, body.agentId, adminUserId);
    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Manual assignment failed' },
      { status: 400 }
    );
  }
}

export const POST = withAuth(['ADMIN'], postHandler);
