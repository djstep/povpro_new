import fs from 'fs';
import path from 'path';
import { ROUTES } from '@/lib/routes';
import { getPageContent } from '@/lib/pages';
import { ALL_HOME_GALLERY_ITEMS, homeGalleryImageUrl } from '@/lib/home-gallery';
import { isDbConfigured, prisma } from '@/lib/db';
import { parseContentBlocks, renderBlockHtml } from '@/lib/cms/content-blocks';
import { resolveContentAssetSrc } from '@/lib/rewrite-content-assets';

export type MediaKindValue = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export type SiteMediaRef = {
  src: string;
  kind: MediaKindValue;
  pages: string[];
  alt?: string;
};

export type LibraryMediaItem = {
  src: string;
  /** URL для миниатюры в админке (webp / CDN для файлов сайта) */
  previewSrc: string;
  filename: string;
  kind: MediaKindValue;
  /** upload — загружен через админку (можно удалить); site — файл из кода сайта */
  source: 'upload' | 'site';
  sizeBytes: number | null;
  mtimeMs: number;
  pages: string[];
  usedAsOverrideFor: string[];
};

const IMG_SRC_RE = /(?:src|poster)=["']([^"']+)["']/gi;
const VIDEO_SRC_RE = /<(?:video|source)[^>]+src=["']([^"']+)["']/gi;
const CSS_URL_RE = /url\(['"]?([^'")]+)['"]?\)/gi;
const IFRAME_SRC_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;
const PDF_LINK_RE = /<a\b[^>]*\bhref=["']([^"'#?]+\.pdf)(?:[?#][^"']*)?["'][^>]*>([\s\S]*?)<\/a>/gi;

function normalizeSrc(src: string): string {
  const trimmed = src.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed}`;
}

function isDocumentSrc(src: string): boolean {
  return /\.pdf(\?|#|$)/i.test(src);
}

function isMediaSrc(src: string): boolean {
  if (src.startsWith('data:')) return false;
  const lower = src.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) {
    return true;
  }
  return (
    /\.(jpg|jpeg|png|gif|webp|svg|avif|mp4|webm|ogg|mov|pdf)(\?|$)/i.test(src) || src.includes('/assets/')
  );
}

function isEmbedSrc(src: string): boolean {
  const lower = src.toLowerCase();
  return lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com');
}

function isVideoSrc(src: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src) || isEmbedSrc(src);
}

function detectKind(src: string): MediaKindValue {
  if (isDocumentSrc(src)) return 'DOCUMENT';
  return isVideoSrc(src) ? 'VIDEO' : 'IMAGE';
}

function addRef(map: Map<string, SiteMediaRef>, src: string, pageSlug: string, alt?: string) {
  const normalized = normalizeSrc(src);
  if (!isMediaSrc(normalized)) return;
  const kind = detectKind(normalized);
  const existing = map.get(normalized);
  if (existing) {
    if (!existing.pages.includes(pageSlug)) existing.pages.push(pageSlug);
    if (alt && !existing.alt) existing.alt = alt;
    return;
  }
  map.set(normalized, { src: normalized, kind, pages: [pageSlug], alt });
}

function linkText(innerHtml: string): string {
  return innerHtml
    .replace(/<span[^>]*material-symbols[^>]*>[\s\S]*?<\/span>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function scanHtml(html: string, pageSlug: string, map: Map<string, SiteMediaRef>) {
  let m: RegExpExecArray | null;

  IMG_SRC_RE.lastIndex = 0;
  while ((m = IMG_SRC_RE.exec(html)) !== null) {
    const tagStart = html.lastIndexOf('<', m.index);
    const tag = html.slice(tagStart, m.index + m[0].length + 80);
    const altMatch = tag.match(/\balt=["']([^"']*)["']/i);
    addRef(map, m[1], pageSlug, altMatch?.[1]);
  }

  VIDEO_SRC_RE.lastIndex = 0;
  while ((m = VIDEO_SRC_RE.exec(html)) !== null) {
    addRef(map, m[1], pageSlug);
  }

  IFRAME_SRC_RE.lastIndex = 0;
  while ((m = IFRAME_SRC_RE.exec(html)) !== null) {
    addRef(map, m[1], pageSlug);
  }

  CSS_URL_RE.lastIndex = 0;
  while ((m = CSS_URL_RE.exec(html)) !== null) {
    addRef(map, m[1], pageSlug);
  }

  PDF_LINK_RE.lastIndex = 0;
  while ((m = PDF_LINK_RE.exec(html)) !== null) {
    addRef(map, m[1], pageSlug, linkText(m[2]) || undefined);
  }
}

function scanContentBlocksJson(raw: string | null | undefined, pageSlug: string, map: Map<string, SiteMediaRef>) {
  const blocks = parseContentBlocks(raw);
  for (const block of blocks) {
    const html = renderBlockHtml(block);
    if (html) scanHtml(html, pageSlug, map);
  }
}

function uploadsDirPath() {
  return path.join(process.cwd(), 'public', 'assets', 'uploads');
}

function isUploadPath(src: string): boolean {
  return normalizeSrc(src).startsWith('/assets/uploads/');
}

/** Сканирует файловые страницы, галерею и (опционально) HTML из БД */
export function scanSiteMedia(dbPages?: { slug: string; body: string | null; contentBlocks: string | null }[]): SiteMediaRef[] {
  const map = new Map<string, SiteMediaRef>();

  for (const route of Object.values(ROUTES)) {
    const html = getPageContent(route.slug);
    if (html) scanHtml(html, route.slug || 'home', map);
  }

  for (const item of ALL_HOME_GALLERY_ITEMS) {
    if (item.kind === 'image') {
      const label = `Галерея ${item.id}`;
      addRef(map, homeGalleryImageUrl(item.id), 'home', label);
      addRef(map, `/assets/img/povpro-gallery-${item.id}.jpg`, 'home', label);
    } else {
      addRef(map, item.src, 'home', 'Видео галерея');
      if (item.poster) addRef(map, item.poster, 'home', 'Видео галерея — постер');
    }
  }

  if (dbPages) {
    for (const page of dbPages) {
      const slug = page.slug || 'home';
      if (page.body) scanHtml(page.body, slug, map);
      if (page.contentBlocks) scanContentBlocksJson(page.contentBlocks, slug, map);
    }
  }

  const uploadsDir = uploadsDirPath();
  if (fs.existsSync(uploadsDir)) {
    for (const file of fs.readdirSync(uploadsDir)) {
      if (file.startsWith('.')) continue;
      addRef(map, `/assets/uploads/${file}`, '_uploads');
    }
  }

  return [...map.values()].sort((a, b) => a.src.localeCompare(b.src, 'ru'));
}

export async function scanSiteMediaWithDb(): Promise<SiteMediaRef[]> {
  let dbPages: { slug: string; body: string | null; contentBlocks: string | null }[] = [];
  if (isDbConfigured()) {
    try {
      dbPages = await prisma.page.findMany({
        select: { slug: true, body: true, contentBlocks: true },
      });
    } catch {
      dbPages = [];
    }
  }
  return scanSiteMedia(dbPages);
}

export type MediaUsage = {
  src: string;
  pages: string[];
  usedAsOverrideFor: string[];
  inLibrary: boolean;
  canDeleteFile: boolean;
};

/** Где используется конкретный путь (страницы + как файл-замена). */
export async function findMediaUsage(src: string): Promise<MediaUsage> {
  const normalized = normalizeSrc(src);
  const scanned = await scanSiteMediaWithDb();
  const hit = scanned.find((i) => i.src === normalized);
  const pages = (hit?.pages ?? []).filter((p) => p !== '_uploads');

  const usedAsOverrideFor: string[] = [];
  if (isDbConfigured()) {
    try {
      const overrides = await prisma.mediaOverride.findMany({
        where: { replacementSrc: normalized },
        select: { originalSrc: true, replacementSrc: true },
      });
      for (const o of overrides) {
        if (o.originalSrc !== normalized) usedAsOverrideFor.push(o.originalSrc);
      }
    } catch {
      /* ignore */
    }
  }

  return {
    src: normalized,
    pages: [...new Set(pages)].sort((a, b) => a.localeCompare(b, 'ru')),
    usedAsOverrideFor: [...new Set(usedAsOverrideFor)],
    inLibrary: isUploadPath(normalized),
    canDeleteFile: isUploadPath(normalized),
  };
}

function publicFileStat(src: string): fs.Stats | null {
  if (!src.startsWith('/assets/')) return null;
  const rel = decodeURIComponent(src.split(/[?#]/)[0]).replace(/^\/+/, '');
  if (rel.includes('..')) return null;
  try {
    const stat = fs.statSync(path.join(process.cwd(), 'public', rel));
    return stat.isFile() ? stat : null;
  } catch {
    return null;
  }
}

/** Ключ для склейки дублей вида x.png / x.webp из /assets/img */
function siteDedupKey(src: string): string {
  return src.startsWith('/assets/img/') ? src.replace(/\.(png|jpe?g|webp)$/i, '') : src;
}

export function mediaPreviewSrc(src: string): string {
  return src.startsWith('/assets/img/') ? resolveContentAssetSrc(src) : src;
}

/**
 * Библиотека: загруженные файлы (/assets/uploads) + все картинки, видео и PDF,
 * которые уже используются на страницах сайта.
 */
export async function listMediaLibrary(
  preScanned?: SiteMediaRef[],
): Promise<LibraryMediaItem[]> {
  const scanned = preScanned ?? (await scanSiteMediaWithDb());
  const usageBySrc = new Map(scanned.map((i) => [i.src, i]));

  let overrideTargets: { originalSrc: string; replacementSrc: string }[] = [];
  if (isDbConfigured()) {
    try {
      overrideTargets = await prisma.mediaOverride.findMany({
        select: { originalSrc: true, replacementSrc: true },
      });
    } catch {
      overrideTargets = [];
    }
  }

  const overridesFor = (src: string) =>
    overrideTargets.filter((o) => o.replacementSrc === src && o.originalSrc !== src).map((o) => o.originalSrc);

  const items: LibraryMediaItem[] = [];

  const uploadsDir = uploadsDirPath();
  if (fs.existsSync(uploadsDir)) {
    for (const filename of fs.readdirSync(uploadsDir)) {
      if (filename.startsWith('.')) continue; // .gitkeep и прочие служебные
      const src = `/assets/uploads/${filename}`;
      if (!isMediaSrc(src)) continue;

      let stat: fs.Stats;
      try {
        stat = fs.statSync(path.join(uploadsDir, filename));
        if (!stat.isFile()) continue;
      } catch {
        continue;
      }
      const pages = (usageBySrc.get(src)?.pages ?? []).filter((p) => p !== '_uploads');

      items.push({
        src,
        previewSrc: src,
        filename,
        kind: detectKind(src),
        source: 'upload',
        sizeBytes: stat.size,
        mtimeMs: stat.mtimeMs,
        pages: [...new Set(pages)].sort((a, b) => a.localeCompare(b, 'ru')),
        usedAsOverrideFor: overridesFor(src),
      });
    }
  }
  items.sort((a, b) => b.mtimeMs - a.mtimeMs);

  const siteByKey = new Map<string, LibraryMediaItem>();
  for (const ref of scanned) {
    if (isUploadPath(ref.src) || isEmbedSrc(ref.src) || /\.svg(\?|$)/i.test(ref.src)) continue;
    const key = siteDedupKey(ref.src);
    const existing = siteByKey.get(key);
    if (existing) {
      for (const p of ref.pages) if (!existing.pages.includes(p)) existing.pages.push(p);
      continue;
    }
    const stat = publicFileStat(ref.src);
    siteByKey.set(key, {
      src: ref.src,
      previewSrc: mediaPreviewSrc(ref.src),
      filename: ref.alt?.trim() || ref.src.split('/').pop() || ref.src,
      kind: ref.kind,
      source: 'site',
      sizeBytes: stat?.size ?? null,
      mtimeMs: stat?.mtimeMs ?? 0,
      pages: [...ref.pages],
      usedAsOverrideFor: [],
    });
  }

  const siteItems = [...siteByKey.values()].map((item) => ({
    ...item,
    pages: [...new Set(item.pages)].sort((a, b) => a.localeCompare(b, 'ru')),
  }));
  siteItems.sort((a, b) => (a.pages[0] ?? '').localeCompare(b.pages[0] ?? '', 'ru') || a.src.localeCompare(b.src));

  return [...items, ...siteItems];
}

export function resolveUploadFilesystemPath(src: string): string | null {
  const normalized = normalizeSrc(src);
  if (!isUploadPath(normalized)) return null;
  const filename = path.basename(normalized);
  if (!filename || filename === '.' || filename === '..' || filename.includes('..')) return null;
  return path.join(uploadsDirPath(), filename);
}

export function deleteUploadFile(src: string): { ok: true } | { ok: false; error: string } {
  const dest = resolveUploadFilesystemPath(src);
  if (!dest) {
    return { ok: false, error: 'Удалять можно только файлы из библиотеки (uploads)' };
  }
  if (!fs.existsSync(dest)) {
    return { ok: false, error: 'Файл не найден' };
  }
  try {
    fs.unlinkSync(dest);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: 'Не удалось удалить файл с диска' };
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
  return `${(n / (1024 * 1024)).toFixed(1)} МБ`;
}
