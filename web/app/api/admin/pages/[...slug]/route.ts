import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin-api-guard';
import { getEditablePageHtml, getPageRecord, isProtectedSlug } from '@/lib/cms/resolve-page-html';
import { parseContentBlocks } from '@/lib/cms/content-blocks';
import { extractTextBlocks } from '@/lib/cms/extract-blocks';
import { getPageContent, getPageTitle } from '@/lib/pages';
import { isDbConfigured, prisma } from '@/lib/db';

type Params = { params: Promise<{ slug: string[] }> };

function decodeSlug(segments: string[]): string {
  const joined = segments.map(decodeURIComponent).join('/');
  return joined === 'home' ? '' : joined;
}

export async function GET(_request: Request, { params }: Params) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const slug = decodeSlug((await params).slug);
  const html = (await getEditablePageHtml(slug)) ?? getPageContent(slug);
  if (!html) {
    return NextResponse.json({ error: 'Страница не найдена' }, { status: 404 });
  }

  const pageSlug = slug || 'home';
  const extracted = extractTextBlocks(html, pageSlug);
  const record = await getPageRecord(slug);

  let dbBlocks: Awaited<ReturnType<typeof prisma.textBlock.findMany>> = [];

  if (isDbConfigured()) {
    try {
      dbBlocks = await prisma.textBlock.findMany({ where: { pageSlug } });
    } catch {
      /* ignore */
    }
  }

  const dbMap = new Map(dbBlocks.map((b) => [b.blockKey, b]));
  const textBlocks = extracted.map((block) => {
    const saved = dbMap.get(block.blockKey);
    return {
      blockKey: block.blockKey,
      label: block.label,
      originalText: block.originalText,
      content: saved?.content ?? block.originalText,
      saved: Boolean(saved),
    };
  });

  const contentBlocks = parseContentBlocks(record?.contentBlocks);

  return NextResponse.json({
    slug,
    title: record?.title ?? getPageTitle(slug),
    html,
    textBlocks,
    contentBlocks,
    pageMeta: {
      published: record?.published ?? true,
      updatedAt: record?.updatedAt?.toISOString(),
      fromDb: Boolean(record?.body || record?.contentBlocks),
      navSection: record?.navSection ?? 'NONE',
      categoryId: record?.categoryId ?? null,
      showInNav: record?.showInNav ?? false,
      sortOrder: record?.sortOrder ?? 0,
      isProtected: record?.isProtected ?? isProtectedSlug(slug),
      metaTitle: record?.metaTitle ?? '',
      metaDesc: record?.metaDesc ?? '',
    },
  });
}

const putSchema = z.object({
  html: z.string().optional(),
  contentBlocks: z.array(z.record(z.string(), z.unknown())).optional(),
  title: z.string().min(1).max(300).optional(),
  metaTitle: z.string().max(300).optional(),
  metaDesc: z.string().max(500).optional(),
  published: z.boolean().optional(),
  navSection: z.enum(['NONE', 'FRICTION', 'MECH', 'USLUGI', 'TOP_LINK']).optional(),
  categoryId: z.string().nullable().optional(),
  showInNav: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'DATABASE_URL не настроен' }, { status: 503 });
  }

  const slug = decodeSlug((await params).slug);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const title = parsed.data.title ?? getPageTitle(slug);
  const contentBlocksJson =
    parsed.data.contentBlocks !== undefined
      ? JSON.stringify(parsed.data.contentBlocks)
      : undefined;

  try {
    const page = await prisma.page.upsert({
      where: { slug },
      create: {
        slug,
        title,
        body: parsed.data.html ?? null,
        contentBlocks: contentBlocksJson ?? null,
        metaTitle: parsed.data.metaTitle ?? null,
        metaDesc: parsed.data.metaDesc ?? null,
        published: parsed.data.published ?? true,
        navSection: parsed.data.navSection ?? 'NONE',
        categoryId: parsed.data.categoryId ?? null,
        showInNav: parsed.data.showInNav ?? false,
        sortOrder: parsed.data.sortOrder ?? 0,
        isProtected: isProtectedSlug(slug),
      },
      update: {
        title,
        body: parsed.data.html !== undefined ? parsed.data.html : undefined,
        contentBlocks: contentBlocksJson,
        metaTitle: parsed.data.metaTitle ?? undefined,
        metaDesc: parsed.data.metaDesc ?? undefined,
        published: parsed.data.published ?? undefined,
        navSection: parsed.data.navSection ?? undefined,
        categoryId: parsed.data.categoryId !== undefined ? parsed.data.categoryId : undefined,
        showInNav: parsed.data.showInNav ?? undefined,
        sortOrder: parsed.data.sortOrder ?? undefined,
      },
    });
    revalidatePath('/', 'layout');
    return NextResponse.json({ ok: true, id: page.id, updatedAt: page.updatedAt.toISOString() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Ошибка сохранения страницы' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'DATABASE_URL не настроен' }, { status: 503 });
  }

  const slug = decodeSlug((await params).slug);

  if (isProtectedSlug(slug)) {
    return NextResponse.json({ error: 'Эту страницу нельзя удалить' }, { status: 403 });
  }

  try {
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page) {
      return NextResponse.json({ error: 'Страница только в файлах — удаление недоступно' }, { status: 404 });
    }
    if (page.isProtected) {
      return NextResponse.json({ error: 'Страница защищена от удаления' }, { status: 403 });
    }

    await prisma.textBlock.deleteMany({ where: { pageSlug: slug || 'home' } });
    await prisma.page.delete({ where: { id: page.id } });
    revalidatePath('/', 'layout');
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 });
  }
}
