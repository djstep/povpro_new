import { NextResponse } from 'next/server';
import { isAdminAuthenticated, isAdminPasswordConfigured } from '@/lib/admin-auth';

export async function requireAdminApi(): Promise<NextResponse | null> {
  if (!isAdminPasswordConfigured()) return null;
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  return null;
}
