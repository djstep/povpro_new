import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, isDbConfigured } from '@/lib/db';

const schema = z.object({
  email: z.string().email().max(200).optional().or(z.literal('')),
  author: z.string().min(1).max(300),
  text: z.string().min(1).max(10000),
  attachments: z.array(z.string().max(300)).max(5).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Проверьте заполнение полей' }, { status: 400 });
  }

  const { email, author, text, attachments } = parsed.data;
  const fullText = attachments?.length
    ? `${text}\n\n---\n${attachments.join('\n')}`
    : text;

  const payload = {
    author,
    email: email || null,
    text: fullText,
    published: false,
  };

  if (!isDbConfigured()) {
    console.info('[review]', payload);
    return NextResponse.json({
      ok: true,
      message: 'Отзыв принят (БД не настроена — см. лог сервера)',
    });
  }

  try {
    const review = await prisma.review.create({ data: payload });
    return NextResponse.json({ ok: true, id: review.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Ошибка сохранения отзыва' }, { status: 500 });
  }
}
