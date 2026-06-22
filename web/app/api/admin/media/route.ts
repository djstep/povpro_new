import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin-api-guard';
import { isDbConfigured, prisma } from '@/lib/db';
import { scanSiteMedia } from '@/lib/cms/extract-media';

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const scanned = scanSiteMedia();
  let overrides: Awaited<ReturnType<typeof prisma.mediaOverride.findMany>> = [];

  if (isDbConfigured()) {
    try {
      overrides = await prisma.mediaOverride.findMany({ orderBy: { updatedAt: 'desc' } });
    } catch {
      /* empty */
    }
  }

  const overrideMap = new Map(overrides.map((o) => [o.originalSrc, o]));

  const items = scanned.map((item) => {
    const override = overrideMap.get(item.src);
    return {
      ...item,
      override: override
        ? {
            id: override.id,
            replacementSrc: override.replacementSrc,
            alt: override.alt,
            kind: override.kind,
            updatedAt: override.updatedAt.toISOString(),
          }
        : null,
      effectiveSrc: override?.replacementSrc ?? item.src,
    };
  });

  for (const override of overrides) {
    if (!items.some((i) => i.src === override.originalSrc)) {
      items.push({
        src: override.originalSrc,
        kind: override.kind,
        pages: ['—'],
        alt: override.alt ?? undefined,
        override: {
          id: override.id,
          replacementSrc: override.replacementSrc,
          alt: override.alt,
          kind: override.kind,
          updatedAt: override.updatedAt.toISOString(),
        },
        effectiveSrc: override.replacementSrc,
      });
    }
  }

  return NextResponse.json({ items });
}

const saveSchema = z.object({
  originalSrc: z.string().min(1).max(2000),
  replacementSrc: z.string().min(1).max(2000),
  alt: z.string().max(500).optional(),
  kind: z.enum(['IMAGE', 'VIDEO']).optional(),
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

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const kind = data.kind ?? (data.replacementSrc.match(/\.(mp4|webm|ogg|mov)|youtube|vimeo/i) ? 'VIDEO' : 'IMAGE');

  try {
    const row = await prisma.mediaOverride.upsert({
      where: { originalSrc: data.originalSrc },
      create: {
        originalSrc: data.originalSrc,
        replacementSrc: data.replacementSrc,
        alt: data.alt ?? null,
        kind,
      },
      update: {
        replacementSrc: data.replacementSrc,
        alt: data.alt ?? null,
        kind,
      },
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 });
  }
}

const deleteSchema = z.object({
  originalSrc: z.string().min(1),
});

export async function DELETE(request: Request) {
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

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Укажите originalSrc' }, { status: 400 });
  }

  try {
    await prisma.mediaOverride.deleteMany({ where: { originalSrc: parsed.data.originalSrc } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 });
  }
}
