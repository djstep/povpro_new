import { NextResponse } from 'next/server';
import { getAdminAuthMode, isAdminAuthenticated } from '@/lib/admin-auth';

export async function requireAdminApi(): Promise<NextResponse | null> {
  const mode = getAdminAuthMode();
  if (mode === 'open') return null;
  if (mode === 'locked') {
    return NextResponse.json(
      { error: 'Админка отключена: на сервере не задан ADMIN_PASSWORD' },
      { status: 503 },
    );
  }
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  return null;
}
