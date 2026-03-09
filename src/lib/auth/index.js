import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { BCRYPT_SALT_ROUNDS, AUTH_TOKEN_EXPIRY_DAYS } from '@/lib/constants';

function getSecret() {
  const secret = process.env.CORTEX_JWT_SECRET || 'default-dev-secret-change-me-32chars';
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
    const secret = getSecret();
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function getPasswordHash() {
  const password = process.env.CORTEX_PASSWORD || 'changeme';
  return hashPassword(password);
}
