import { NextRequest, NextResponse } from 'next/server';
import { updateStatus } from '../../../../../modules/tracking/tracking.service';
import { withAuth } from '../../../../../lib/rbac';

// PATCH /api/orders/:id/status - Update order status (assigned AGENT or ADMIN)
async function patchHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; user: { userId: string; role: any } }
) {
  try {
    const params = await context.params;
    const orderId = params.id;
    const { userId, role } = context.user;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const order = await updateStatus(orderId, body.status, userId, role);
    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Status transition failed' },
      { status: 400 }
    );
  }
}

export const PATCH = withAuth(['AGENT', 'ADMIN'], patchHandler);
