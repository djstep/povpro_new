import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin-api-guard';
import { isDbConfigured, prisma } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'DONE', 'ARCHIVED']).optional(),
  adminNote: z.string().max(5000).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'DATABASE_URL не настроен' }, { status: 503 });
  }

  const { id } = await params;
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

  try {
    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote,
      },
    });
    return NextResponse.json({ ok: true, inquiry });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
  }
}
