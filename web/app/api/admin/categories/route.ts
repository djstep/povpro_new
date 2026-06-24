import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin-api-guard';
import { isDbConfigured, prisma } from '@/lib/db';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  navSection: z.enum(['FRICTION', 'MECH', 'USLUGI', 'TOP_LINK', 'NONE']),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!isDbConfigured()) {
    return NextResponse.json({ categories: [] });
  }

  try {
    const categories = await prisma.pageCategory.findMany({
      orderBy: [{ navSection: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
      include: { parent: true },
    });
    return NextResponse.json({ categories });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ categories: [] });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'DATABASE_URL не настроен' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const category = await prisma.pageCategory.create({ data: parsed.data });
    revalidatePath('/', 'layout');
    return NextResponse.json({ ok: true, category });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Ошибка создания категории' }, { status: 500 });
  }
}
