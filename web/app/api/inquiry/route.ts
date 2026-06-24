import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, isDbConfigured } from '@/lib/db';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional().or(z.literal('')),
  message: z.string().max(5000).optional(),
  source: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  const limit = rateLimit(`inquiry:${getClientIp(request)}`, 5, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Слишком много заявок подряд. Подождите минуту.' },
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  if (!isDbConfigured()) {
    console.info('[inquiry]', data);
    return NextResponse.json({
      ok: true,
      message: 'Заявка принята (БД не настроена — см. лог сервера)',
    });
  }

  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        message: data.message || null,
        source: data.source || 'site',
      },
    });
    return NextResponse.json({ ok: true, id: inquiry.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Ошибка сохранения заявки' }, { status: 500 });
  }
}
