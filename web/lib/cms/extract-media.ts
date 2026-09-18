import fs from 'fs';
import path from 'path';
import { ROUTES } from '@/lib/routes';
import { getPageContent } from '@/lib/pages';
import { ALL_HOME_GALLERY_ITEMS, homeGalleryImageUrl } from '@/lib/home-gallery';
import { isDbConfigured, prisma } from '@/lib/db';
import { parseContentBlocks } from '@/lib/cms/content-blocks';

export type SiteMediaRef = {
  src: string;
  kind: 'IMAGE' | 'VIDEO';
  pages: string[];
  alt?: string;
};

export type LibraryMediaItem = {
  src: string;
  filename: string;
  kind: 'IMAGE' | 'VIDEO';
  sizeBytes: number;
  mtimeMs: number;
  pages: string[];
  usedAsOverrideFor: string[];
};

const IMG_SRC_RE = /(?:src|poster)=["']([^"']+)["']/gi;
const VIDEO_SRC_RE = /<(?:video|source)[^>]+src=["']([^"']+)["']/gi;
const CSS_URL_RE = /url\(['"]?([^'")]+)['"]?\)/gi;
const IFRAME_SRC_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;

function normalizeSrc(src: string): string {
  const trimmed = src.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed}`;
}

function isMediaSrc(src: string): boolean {
  if (src.startsWith('data:')) return false;
  const lower = src.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) {
    return true;
  }
  return /\.(jpg|jpeg|png|gif|webp|svg|avif|mp4|webm|ogg|mov)(\?|$)/i.test(src) || src.includes('/assets/');
}

function isVideoSrc(src: string): boolean {
  const lower = src.toLowerCase();
  return (
    /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src) ||
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com')
  );
}

function addRef(map: Map<string, SiteMediaRef>, src: string, pageSlug: string, alt?: string) {
  const normalized = normalizeSrc(src);
  if (!isMediaSrc(normalized)) return;
  const kind = isVideoSrc(normalized) ? 'VIDEO' : 'IMAGE';
  const existing = map.get(normalized);
  if (existing) {
    if (!existing.pages.includes(pageSlug)) existing.pages.push(pageSlug);
    if (alt && !existing.alt) existing.alt = alt;
    return;
  }
  map.set(normalized, { src: normalized, kind, pages: [pageSlug], alt });
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
}

function scanContentBlocksJson(raw: string | null | undefined, pageSlug: string, map: Map<string, SiteMediaRef>) {
  const blocks = parseContentBlocks(raw);
  for (const block of blocks) {
    if (block.type === 'image' && block.src) addRef(map, block.src, pageSlug, block.alt);
    if (block.type === 'video') {
      if (block.src) addRef(map, block.src, pageSlug);
      if (block.poster) addRef(map, block.poster, pageSlug);
    }
    if (block.type === 'hero' && block.image) addRef(map, block.image, pageSlug);
    if (block.type === 'html' && block.content) scanHtml(block.content, pageSlug, map);
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
        where: {
          OR: [{ originalSrc: normalized }, { replacementSrc: normalized }],
        },
        select: { originalSrc: true, replacementSrc: true },
      });
      for (const o of overrides) {
        if (o.replacementSrc === normalized && o.originalSrc !== normalized) {
          usedAsOverrideFor.push(o.originalSrc);
        }
        if (o.originalSrc === normalized && !pages.includes('(замена на сайте)')) {
          // original slot itself
        }
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

/** Файлы из /assets/uploads с метаданными и usage */
export async function listMediaLibrary(): Promise<LibraryMediaItem[]> {
  const scanned = await scanSiteMediaWithDb();
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

  const uploadsDir = uploadsDirPath();
  if (!fs.existsSync(uploadsDir)) return [];

  const files = fs.readdirSync(uploadsDir);
  const items: LibraryMediaItem[] = [];

  for (const filename of files) {
    if (filename.startsWith('.')) continue; // .gitkeep и прочие служебные
    if (!isMediaSrc(`/assets/uploads/${filename}`)) continue;

    const full = path.join(uploadsDir, filename);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(full);
      if (!stat.isFile()) continue;
    } catch {
      continue;
    }
    const src = `/assets/uploads/${filename}`;
    const usage = usageBySrc.get(src);
    const pages = (usage?.pages ?? []).filter((p) => p !== '_uploads');
    const usedAsOverrideFor = overrideTargets
      .filter((o) => o.replacementSrc === src && o.originalSrc !== src)
      .map((o) => o.originalSrc);

    items.push({
      src,
      filename,
      kind: isVideoSrc(src) ? 'VIDEO' : 'IMAGE',
      sizeBytes: stat.size,
      mtimeMs: stat.mtimeMs,
      pages: [...new Set(pages)].sort((a, b) => a.localeCompare(b, 'ru')),
      usedAsOverrideFor,
    });
  }

  return items.sort((a, b) => b.mtimeMs - a.mtimeMs);
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
