import { NextRequest, NextResponse } from 'next/server';
import { rescheduleOrder } from '../../../../../modules/tracking/tracking.service';
import { withAuth } from '../../../../../lib/rbac';

// POST /api/orders/:id/reschedule - Reschedule a FAILED delivery (CUSTOMER owner or ADMIN)
async function postHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; user: { userId: string; role: any } }
) {
  try {
    const params = await context.params;
    const orderId = params.id;
    const { userId, role } = context.user;
    const body = await request.json();

    if (!body.rescheduleDate) {
      return NextResponse.json({ error: 'rescheduleDate is required' }, { status: 400 });
    }

    const order = await rescheduleOrder(orderId, body.rescheduleDate, userId, role);
    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Rescheduling failed' },
      { status: 400 }
    );
  }
}

export const POST = withAuth(['CUSTOMER', 'ADMIN'], postHandler);
