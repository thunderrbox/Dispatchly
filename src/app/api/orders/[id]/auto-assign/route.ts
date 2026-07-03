import { NextRequest, NextResponse } from 'next/server';
import { autoAssign } from '../../../../../modules/assignment/assignment.service';
import { withAuth } from '../../../../../lib/rbac';

// POST /api/orders/:id/auto-assign - Auto-assign closest available agent (ADMIN only)
async function postHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; user: { userId: string } }
) {
  try {
    const params = await context.params;
    const orderId = params.id;
    const { userId: adminUserId } = context.user;

    const result = await autoAssign(orderId, adminUserId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Auto assignment failed' },
      { status: 400 }
    );
  }
}

export const POST = withAuth(['ADMIN'], postHandler);
