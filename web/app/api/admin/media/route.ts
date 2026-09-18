import { NextResponse } from 'next/server';
import { revalidateSiteContent } from '@/lib/revalidate-site';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin-api-guard';
import { isDbConfigured, prisma } from '@/lib/db';
import {
  deleteUploadFile,
  findMediaUsage,
  listMediaLibrary,
  scanSiteMediaWithDb,
} from '@/lib/cms/extract-media';

export async function GET(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const url = new URL(request.url);
  const view = url.searchParams.get('view');

  if (view === 'library') {
    const library = await listMediaLibrary();
    return NextResponse.json({ library });
  }

  if (view === 'usage') {
    const src = url.searchParams.get('src');
    if (!src) {
      return NextResponse.json({ error: 'Укажите src' }, { status: 400 });
    }
    const usage = await findMediaUsage(src);
    return NextResponse.json({ usage });
  }

  const scanned = await scanSiteMediaWithDb();
  let overrides: Awaited<ReturnType<typeof prisma.mediaOverride.findMany>> = [];

  if (isDbConfigured()) {
    try {
      overrides = await prisma.mediaOverride.findMany({ orderBy: { updatedAt: 'desc' } });
    } catch {
      /* empty */
    }
  }

  const overrideMap = new Map(overrides.map((o) => [o.originalSrc, o]));

  const items = scanned
    .filter((item) => !item.pages.every((p) => p === '_uploads'))
    .map((item) => {
      const override = overrideMap.get(item.src);
      return {
        ...item,
        pages: item.pages.filter((p) => p !== '_uploads'),
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
        pages: [],
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

  const library = await listMediaLibrary();

  return NextResponse.json({ items, library });
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
  const kind =
    data.kind ??
    (data.replacementSrc.match(/\.(mp4|webm|ogg|mov)|youtube|vimeo/i) ? 'VIDEO' : 'IMAGE');

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
    revalidateSiteContent();
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 });
  }
}

const deleteSchema = z.union([
  z.object({
    action: z.literal('delete-file'),
    src: z.string().min(1),
    force: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('reset-override').optional(),
    originalSrc: z.string().min(1),
  }),
]);

export async function DELETE(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Неверный запрос' }, { status: 400 });
  }

  const data = parsed.data;

  if ('src' in data && data.action === 'delete-file') {
    const usage = await findMediaUsage(data.src);
    if (!usage.canDeleteFile) {
      return NextResponse.json(
        { error: 'Удалять можно только загруженные файлы из библиотеки', usage },
        { status: 400 },
      );
    }

    const isUsed = usage.pages.length > 0 || usage.usedAsOverrideFor.length > 0;
    if (isUsed && !data.force) {
      return NextResponse.json(
        {
          error: 'Файл используется на сайте',
          usage,
          requiresForce: true,
        },
        { status: 409 },
      );
    }

    if (isDbConfigured() && usage.usedAsOverrideFor.length > 0) {
      try {
        await prisma.mediaOverride.deleteMany({
          where: { replacementSrc: usage.src },
        });
      } catch (e) {
        console.error(e);
      }
    }

    const result = deleteUploadFile(data.src);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    revalidateSiteContent();
    return NextResponse.json({ ok: true, usage });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'DATABASE_URL не настроен' }, { status: 503 });
  }

  try {
    await prisma.mediaOverride.deleteMany({ where: { originalSrc: data.originalSrc } });
    revalidateSiteContent();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 });
  }
}
