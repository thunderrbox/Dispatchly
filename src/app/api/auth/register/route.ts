import { NextRequest, NextResponse } from 'next/server';
import { register } from '../../../../modules/auth/auth.service';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await register(body);
    const response = NextResponse.json(result, { status: 201 });
    response.cookies.set({
      name: 'token',
      value: result.token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    return response;
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    let errMsg = error.message || 'Something went wrong';
    if (errMsg.includes('DATABASE_URL') || errMsg.includes('Can\'t reach database server')) {
      errMsg = 'Database connection error: Please configure a valid DATABASE_URL in your .env file.';
    } else if (errMsg.includes('prisma') || errMsg.includes('does not exist in the current database')) {
      errMsg = 'Database schema sync in progress. Please try registering again in a moment.';
    }
    return NextResponse.json(
      { error: errMsg },
      { status: 400 }
    );
  }
}
