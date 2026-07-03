import { NextRequest, NextResponse } from 'next/server';
import { login } from '../../../../modules/auth/auth.service';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await login(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Invalid email or password' },
      { status: 401 }
    );
  }
}
