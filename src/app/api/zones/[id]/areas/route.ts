import { NextRequest, NextResponse } from 'next/server';
import { addAreaToZone } from '../../../../../modules/zone/zone.service';
import { withAuth } from '../../../../../lib/rbac';
import { ZodError } from 'zod';

// POST /api/zones/:id/areas - Add area to zone (ADMIN only)
async function postHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const zoneId = params.id;
    const body = await request.json();
    
    const area = await addAreaToZone(zoneId, body.name);
    return NextResponse.json(area, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to add area to zone' },
      { status: 400 }
    );
  }
}

export const POST = withAuth(['ADMIN'], postHandler);
