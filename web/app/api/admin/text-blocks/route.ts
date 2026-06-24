import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin-api-guard';
import { isDbConfigured, prisma } from '@/lib/db';

const schema = z.object({
  pageSlug: z.string().min(0).max(200),
  blocks: z.array(
    z.object({
      blockKey: z.string().min(1).max(300),
      label: z.string().max(500).optional(),
      originalText: z.string().min(1),
      content: z.string(),
    }),
  ),
});

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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pageSlug = parsed.data.pageSlug || 'home';

  try {
    await prisma.$transaction(
      parsed.data.blocks.map((block) =>
        block.content === block.originalText
          ? prisma.textBlock.deleteMany({ where: { pageSlug, blockKey: block.blockKey } })
          : prisma.textBlock.upsert({
              where: { pageSlug_blockKey: { pageSlug, blockKey: block.blockKey } },
              create: {
                pageSlug,
                blockKey: block.blockKey,
                label: block.label ?? null,
                originalText: block.originalText,
                content: block.content,
              },
              update: {
                label: block.label ?? undefined,
                content: block.content,
              },
            }),
      ),
    );
    revalidatePath('/', 'layout');
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Ошибка сохранения блоков' }, { status: 500 });
  }
}
