import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { BCRYPT_SALT_ROUNDS, AUTH_TOKEN_EXPIRY_DAYS } from '@/lib/constants';

export function getJwtSecret() {
  const secret = process.env.CORTEX_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CORTEX_JWT_SECRET must be set in production');
    }
    console.warn('[auth] CORTEX_JWT_SECRET not set — using insecure dev default');
    return new TextEncoder().encode('default-dev-secret-change-me-32chars');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function createToken() {
  const secret = getSecret();
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_TOKEN_EXPIRY_DAYS}d`)
    .sign(secret);
}

export async function verifyToken(token) {
  try {
    const secret = getJwtSecret();
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function getPasswordHash() {
  const password = process.env.CORTEX_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CORTEX_PASSWORD must be set in production');
    }
    console.warn('[auth] CORTEX_PASSWORD not set — using insecure dev default');
    return hashPassword('changeme');
  }
  return hashPassword(password);
}
