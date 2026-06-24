import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin-api-guard';
import { isDbConfigured, prisma } from '@/lib/db';
import { ROUTES } from '@/lib/routes';
import { slugifySegment, isProtectedSlug } from '@/lib/cms/resolve-page-html';
import { defaultContentBlocksServer } from '@/lib/cms/content-blocks';

const createSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200).optional(),
  slugSegment: z.string().max(100).optional(),
  parentSlug: z.string().max(200).optional(),
  navSection: z.enum(['NONE', 'FRICTION', 'MECH', 'USLUGI', 'TOP_LINK']).default('NONE'),
  categoryId: z.string().optional().nullable(),
  showInNav: z.boolean().default(true),
  published: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  useBlocks: z.boolean().default(true),
  metaTitle: z.string().max(300).optional(),
  metaDesc: z.string().max(500).optional(),
});

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const staticRoutes = Object.values(ROUTES).map((r) => ({
    slug: r.slug,
    title: r.title,
    source: 'static' as const,
    url: r.slug === '' ? '/' : `/${r.slug}`,
  }));

  if (!isDbConfigured()) {
    return NextResponse.json({ pages: staticRoutes, categories: [] });
  }

  try {
    const [dbPages, categories] = await Promise.all([
      prisma.page.findMany({
        include: { category: true },
        orderBy: [{ navSection: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
      }),
      prisma.pageCategory.findMany({
        include: { parent: true, _count: { select: { pages: true, children: true } } },
        orderBy: [{ navSection: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
      }),
    ]);

    const staticSlugs = new Set<string>(staticRoutes.map((r) => r.slug));
    const merged = [
      ...staticRoutes.map((r) => {
        const db = dbPages.find((p) => p.slug === r.slug);
        return {
          ...r,
          source: 'static' as const,
          dbId: db?.id ?? null,
          published: db?.published ?? true,
          showInNav: db?.showInNav ?? false,
          navSection: db?.navSection ?? 'NONE',
          categoryId: db?.categoryId ?? null,
          isProtected: db?.isProtected ?? (r.slug === '' || r.slug === 'contacts'),
          hasDbBody: Boolean(db?.body || db?.contentBlocks),
        };
      }),
      ...dbPages
        .filter((p) => !staticSlugs.has(p.slug))
        .map((p) => ({
          slug: p.slug,
          title: p.title,
          source: 'db' as const,
          url: `/${p.slug}`,
          dbId: p.id,
          published: p.published,
          showInNav: p.showInNav,
          navSection: p.navSection,
          categoryId: p.categoryId,
          categoryTitle: p.category?.title ?? null,
          isProtected: p.isProtected,
          hasDbBody: Boolean(p.body || p.contentBlocks),
          sortOrder: p.sortOrder,
        })),
    ];

    return NextResponse.json({
      pages: merged,
      categories: categories.map((c) => ({
        id: c.id,
        title: c.title,
        navSection: c.navSection,
        parentId: c.parentId,
        parentTitle: c.parent?.title ?? null,
        sortOrder: c.sortOrder,
        pagesCount: c._count.pages,
        childrenCount: c._count.children,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ pages: staticRoutes, categories: [], error: 'schema' });
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

  const data = parsed.data;
  let fullSlug = data.slug?.trim() ?? '';
  if (!fullSlug) {
    const segment = slugifySegment(data.slugSegment ?? data.title);
    if (!segment) {
      return NextResponse.json({ error: 'Не удалось сформировать URL' }, { status: 400 });
    }
    fullSlug = data.parentSlug ? `${data.parentSlug.replace(/\/$/, '')}/${segment}` : segment;
  }

  fullSlug = fullSlug.replace(/^\/+/, '').replace(/\/+/g, '/');

  if (isProtectedSlug(fullSlug) || fullSlug === 'admin') {
    return NextResponse.json({ error: 'Зарезервированный URL' }, { status: 400 });
  }

  try {
    const existing = await prisma.page.findUnique({ where: { slug: fullSlug } });
    if (existing) {
      return NextResponse.json({ error: 'Страница с таким URL уже существует' }, { status: 409 });
    }

    const blocks = data.useBlocks ? defaultContentBlocksServer(data.title) : [];

    const page = await prisma.page.create({
      data: {
        slug: fullSlug,
        title: data.title,
        contentBlocks: blocks.length > 0 ? JSON.stringify(blocks) : null,
        body: blocks.length > 0 ? null : `<main class="flex-grow pt-32 md:pt-40 w-full pb-24"><section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop"><h1 class="font-headline-xl text-headline-xl text-on-surface mb-6">${data.title}</h1></section></main>`,
        navSection: data.navSection,
        categoryId: data.categoryId ?? null,
        showInNav: data.showInNav,
        published: data.published,
        sortOrder: data.sortOrder,
        metaTitle: data.metaTitle ?? null,
        metaDesc: data.metaDesc ?? null,
      },
    });

    revalidatePath('/', 'layout');
    return NextResponse.json({ ok: true, page: { id: page.id, slug: page.slug } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Ошибка создания страницы' }, { status: 500 });
  }
}
