import { NextRequest, NextResponse } from 'next/server';
import { googleAuth } from '../../../../modules/auth/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let email = body.email;
    let name = body.name;

    // Handle Google ID Token / credential string if provided
    if (body.credential && !email) {
      try {
        // Decode JWT payload from Google credential (header.payload.signature)
        const parts = body.credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          const googlePayload = JSON.parse(payloadJson);
          email = googlePayload.email;
          name = googlePayload.name || googlePayload.given_name || email.split('@')[0];
        }
      } catch (err) {
        // Fallback to body properties
      }
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid Google credential: Email is required' },
        { status: 400 }
      );
    }

    const result = await googleAuth({
      email,
      name: name || email.split('@')[0],
      role: body.role || 'CUSTOMER',
      adminSecretKey: body.adminSecretKey,
    });

    const response = NextResponse.json(result, { status: 200 });
    response.cookies.set({
      name: 'token',
      value: result.token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Google authentication failed' },
      { status: 400 }
    );
  }
}
