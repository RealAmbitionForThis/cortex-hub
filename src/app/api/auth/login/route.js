import { NextResponse } from 'next/server';
import { verifyPassword, createToken, getPasswordHash } from '@/lib/auth';
import { AUTH_COOKIE_NAME, AUTH_TOKEN_EXPIRY_DAYS } from '@/lib/constants';

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const hash = await getPasswordHash();
    const valid = await verifyPassword(password, hash);

    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = await createToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
