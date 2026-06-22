import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from '@/lib/admin-auth';

const schema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json({
      ok: true,
      message: 'ADMIN_PASSWORD не задан — вход не требуется',
    });
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

  const token = createAdminSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieOptions(token));
  return response;
}
