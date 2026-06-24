import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  adminSessionCookieOptions,
  createAdminSessionToken,
  getAdminAuthMode,
  verifyAdminPassword,
} from '@/lib/admin-auth';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const mode = getAdminAuthMode();

  if (mode === 'open') {
    return NextResponse.json({
      ok: true,
      message: 'ADMIN_PASSWORD не задан — вход не требуется',
    });
  }

  if (mode === 'locked') {
    return NextResponse.json(
      { error: 'Админка отключена: на сервере не задан ADMIN_PASSWORD' },
      { status: 503 },
    );
  }

  const limit = rateLimit(`login:${getClientIp(request)}`, 10, 5 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Слишком много попыток входа. Повторите позже.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Укажите пароль' }, { status: 400 });
  }

  if (!verifyAdminPassword(parsed.data.password)) {
    return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieOptions(token));
  return response;
}
