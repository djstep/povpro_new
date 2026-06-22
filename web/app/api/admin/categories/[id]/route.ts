import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin-api-guard';
import { isDbConfigured, prisma } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  navSection: z.enum(['FRICTION', 'MECH', 'USLUGI', 'TOP_LINK', 'NONE']).optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const category = await prisma.pageCategory.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ ok: true, category });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'DATABASE_URL не настроен' }, { status: 503 });
  }

  const { id } = await params;

  try {
    await prisma.page.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await prisma.pageCategory.updateMany({ where: { parentId: id }, data: { parentId: null } });
    await prisma.pageCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 });
  }
}
