import { NextRequest, NextResponse } from 'next/server';
import { calculateRate } from '../../../../modules/rate/rate.service';
import { withAuth } from '../../../../lib/rbac';
import { ZodError } from 'zod';

// POST /api/rate-cards/calculate - Calculate rate preview
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await calculateRate(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to calculate rate' },
      { status: 400 }
    );
  }
}

export const POST = withAuth(['CUSTOMER', 'AGENT', 'ADMIN'], postHandler);
