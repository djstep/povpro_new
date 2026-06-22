import { ROUTES } from '@/lib/routes';
import { getPageContent } from '@/lib/pages';
import { isDbConfigured, prisma } from '@/lib/db';
import {
  parseContentBlocks,
  renderContentBlocks,
  type ContentBlock,
} from './content-blocks';
import { applyMediaOverrides, applyTextBlockOverrides } from './apply-overrides';
import { rewriteContentAssets } from '@/lib/rewrite-content-assets';

const PROTECTED_SLUGS = new Set(['', 'home', 'contacts']);

export function slugifySegment(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => {
      const map: Record<string, string> = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
        й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
        у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
        э: 'e', ю: 'yu', я: 'ya',
      };
      return map[c] ?? c;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function pageExists(slug: string): Promise<boolean> {
  const normalized = slug === 'home' ? '' : slug;
  if (normalized === '' || ROUTES[`/${normalized}` as keyof typeof ROUTES]) {
    return true;
  }
  if (!isDbConfigured()) return false;
  try {
    const page = await prisma.page.findUnique({ where: { slug: normalized } });
    return Boolean(page);
  } catch {
    return false;
  }
}

export async function getAllSiteSlugs(): Promise<{ slug: string[] | undefined }[]> {
  const staticSlugs = Object.values(ROUTES).map((r) => ({
    slug: r.slug === '' ? undefined : r.slug.split('/'),
  }));

  if (!isDbConfigured()) return staticSlugs;

  try {
    const dbPages = await prisma.page.findMany({
      where: { published: true },
      select: { slug: true },
    });
    const seen = new Set(staticSlugs.map((s) => (s.slug ? s.slug.join('/') : '')));
    const extra = dbPages
      .filter((p) => !seen.has(p.slug) && p.slug !== '')
      .map((p) => ({ slug: p.slug.split('/') }));
    return [...staticSlugs, ...extra];
  } catch {
    return staticSlugs;
  }
}

async function loadOverrides() {
  if (!isDbConfigured()) {
    return { media: [], text: [] as Awaited<ReturnType<typeof prisma.textBlock.findMany>> };
  }
  try {
    const [media, text] = await Promise.all([
      prisma.mediaOverride.findMany(),
      prisma.textBlock.findMany(),
    ]);
    return { media, text };
  } catch {
    return { media: [], text: [] };
  }
}

function blocksToHtml(contentBlocks: string | null, body: string | null): string | null {
  const blocks = parseContentBlocks(contentBlocks);
  if (blocks.length > 0) return renderContentBlocks(blocks);
  return body;
}

export async function getBasePageHtml(slug: string): Promise<string | null> {
  const normalized = slug === 'home' ? '' : slug;

  if (isDbConfigured()) {
    try {
      const page = await prisma.page.findUnique({
        where: { slug: normalized, published: true },
      });
      if (page) {
        const html = blocksToHtml(page.contentBlocks, page.body);
        if (html) return html;
      }
    } catch {
      /* file fallback */
    }
  }

  return getPageContent(normalized);
}

export async function resolvePageHtml(slug: string): Promise<string | null> {
  const normalized = slug === 'home' ? '' : slug;
  const base = await getBasePageHtml(normalized);
  if (!base) return null;

  const { media, text } = await loadOverrides();
  const slugText = text.filter(
    (b) => b.pageSlug === normalized || b.pageSlug === (normalized || 'home'),
  );

  let html = applyTextBlockOverrides(base, slugText);
  html = applyMediaOverrides(html, media);
  html = rewriteContentAssets(html);
  return html;
}

export async function getEditablePageHtml(slug: string): Promise<string | null> {
  const normalized = slug === 'home' ? '' : slug;

  if (isDbConfigured()) {
    try {
      const page = await prisma.page.findUnique({ where: { slug: normalized } });
      if (page) {
        const raw = blocksToHtml(page.contentBlocks, page.body);
        if (raw) {
          const { media, text } = await loadOverrides();
          const slugText = text.filter(
            (b) => b.pageSlug === normalized || b.pageSlug === (normalized || 'home'),
          );
          let html = applyTextBlockOverrides(raw, slugText);
          html = applyMediaOverrides(html, media);
          return html;
        }
      }
    } catch {
      /* fallback */
    }
  }

  const fileHtml = getPageContent(normalized);
  if (!fileHtml) return null;
  const { media, text } = await loadOverrides();
  const slugText = text.filter(
    (b) => b.pageSlug === normalized || b.pageSlug === (normalized || 'home'),
  );
  let html = applyTextBlockOverrides(fileHtml, slugText);
  html = applyMediaOverrides(html, media);
  return html;
}

export async function getPageRecord(slug: string) {
  if (!isDbConfigured()) return null;
  const normalized = slug === 'home' ? '' : slug;
  try {
    return await prisma.page.findUnique({
      where: { slug: normalized },
      include: { category: true },
    });
  } catch {
    return null;
  }
}

export function parsePageContentBlocks(raw: string | null | undefined): ContentBlock[] {
  return parseContentBlocks(raw);
}

export function isProtectedSlug(slug: string): boolean {
  return PROTECTED_SLUGS.has(slug) || slug === '';
}
