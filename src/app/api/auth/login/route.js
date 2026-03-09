import { NextResponse } from 'next/server';
import { verifyPassword, createToken, getPasswordHash } from '@/lib/auth';
import { badRequest, error } from '@/lib/api/response';
import { AUTH_COOKIE_NAME, AUTH_TOKEN_EXPIRY_DAYS } from '@/lib/constants';

export async function POST(request) {
  try {
    const { password } = await request.json();
    if (!password) return badRequest('Password required');

    const hash = await getPasswordHash();
    const valid = await verifyPassword(password, hash);
    if (!valid) return error('Invalid password', 401);

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
  } catch (err) {
    return error('Login failed');
  }
}
