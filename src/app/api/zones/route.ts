import { NextRequest, NextResponse } from 'next/server';
import { createZone, listZones } from '../../../modules/zone/zone.service';
import { withAuth } from '../../../lib/rbac';
import { ZodError } from 'zod';

// GET /api/zones - List all zones (accessible to all authenticated roles)
async function getHandler(request: NextRequest) {
  try {
    const zones = await listZones();
    return NextResponse.json(zones, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to list zones' },
      { status: 500 }
    );
  }
}

// POST /api/zones - Create a new zone (ADMIN only)
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const zone = await createZone(body.name);
    return NextResponse.json(zone, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create zone' },
      { status: 400 }
    );
  }
}

// Export with RBAC wrapping
export const GET = withAuth(['CUSTOMER', 'AGENT', 'ADMIN'], getHandler);
export const POST = withAuth(['ADMIN'], postHandler);
