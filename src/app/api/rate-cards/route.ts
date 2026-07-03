import { NextRequest, NextResponse } from 'next/server';
import { createRateCard, listRateCards } from '../../../modules/rate/rate.service';
import { withAuth } from '../../../lib/rbac';
import { ZodError } from 'zod';

// GET /api/rate-cards - List all rate cards
async function getHandler(request: NextRequest) {
  try {
    const rateCards = await listRateCards();
    return NextResponse.json(rateCards, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to list rate cards' },
      { status: 500 }
    );
  }
}

// POST /api/rate-cards - Create or update a rate card (ADMIN only)
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const rateCard = await createRateCard(body);
    return NextResponse.json(rateCard, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create rate card' },
      { status: 400 }
    );
  }
}

export const GET = withAuth(['CUSTOMER', 'AGENT', 'ADMIN'], getHandler);
export const POST = withAuth(['ADMIN'], postHandler);
