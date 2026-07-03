import { NextRequest, NextResponse } from 'next/server';
import { createOrder, listOrders } from '../../../modules/order/order.service';
import { withAuth } from '../../../lib/rbac';
import { ZodError } from 'zod';

// GET /api/orders - List all orders (role-scoped RBAC)
async function getHandler(request: NextRequest, context: { user: { userId: string; role: any } }) {
  try {
    const { userId, role } = context.user;
    const orders = await listOrders(userId, role);
    return NextResponse.json(orders, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to list orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order (CUSTOMER or ADMIN)
async function postHandler(request: NextRequest, context: { user: { userId: string; role: any } }) {
  try {
    const body = await request.json();
    const { userId, role } = context.user;

    // Resolve customerId
    // Customers can only create for themselves. Admins can create on behalf of anyone.
    let customerId = userId;
    if (role === 'ADMIN' && body.customerId) {
      customerId = body.customerId;
    }

    const order = await createOrder({
      ...body,
      customerId,
      createdByUserId: userId,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 400 }
    );
  }
}

export const GET = withAuth(['CUSTOMER', 'AGENT', 'ADMIN'], getHandler);
export const POST = withAuth(['CUSTOMER', 'ADMIN'], postHandler);
