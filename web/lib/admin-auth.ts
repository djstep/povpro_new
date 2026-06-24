import { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_SEC,
  getAdminAuthMode,
} from '@/lib/admin-auth-constants';
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '@/lib/admin-auth-crypto';

export { ADMIN_COOKIE, isAdminPasswordConfigured, getAdminAuthMode } from '@/lib/admin-auth-constants';
export { createAdminSessionToken, verifyAdminSessionToken } from '@/lib/admin-auth-crypto';

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return true;
  if (password.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(password), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function getAdminSessionFromCookies(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const mode = getAdminAuthMode();
  if (mode === 'open') return true;
  if (mode === 'locked') return false;
  const token = await getAdminSessionFromCookies();
  return await verifyAdminSessionToken(token);
}

export function adminSessionCookieOptions(token: string) {
  return {
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export function clearAdminSessionCookieOptions() {
  return {
    name: ADMIN_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  };
}
