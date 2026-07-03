import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '../../../../modules/order/order.service';
import { withAuth } from '../../../../lib/rbac';

// GET /api/orders/:id - Get order details (role-scoped RBAC)
async function getHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; user: { userId: string; role: any } }
) {
  try {
    const params = await context.params;
    const orderId = params.id;
    const { userId, role } = context.user;

    const order = await getOrder(orderId, userId, role);
    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : 404;
    return NextResponse.json(
      { error: error.message || 'Order not found' },
      { status }
    );
  }
}

export const GET = withAuth(['CUSTOMER', 'AGENT', 'ADMIN'], getHandler);
// We'll support order updates (like reschedule or status) on other sub-endpoints as per §5.
