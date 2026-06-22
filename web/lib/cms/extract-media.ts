import fs from 'fs';
import path from 'path';
import { ROUTES } from '@/lib/routes';
import { getPageContent } from '@/lib/pages';
import { HOME_GALLERY_SECTIONS, homeGalleryImageUrl } from '@/lib/home-gallery';

export type SiteMediaRef = {
  src: string;
  kind: 'IMAGE' | 'VIDEO';
  pages: string[];
  alt?: string;
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

function scanHtml(html: string, pageSlug: string, map: Map<string, SiteMediaRef>) {
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

/** Сканирует все страницы и галерею — список медиа для админки */
export function scanSiteMedia(): SiteMediaRef[] {
  const map = new Map<string, SiteMediaRef>();

  for (const route of Object.values(ROUTES)) {
    const html = getPageContent(route.slug);
    if (html) scanHtml(html, route.slug || 'home', map);
  }

  for (const section of HOME_GALLERY_SECTIONS) {
    for (const item of section.items) {
      addRef(map, homeGalleryImageUrl(item.id), 'home', item.title);
      addRef(map, `/assets/img/povpro-gallery-${item.id}.jpg`, 'home', item.title);
    }
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'assets', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    for (const file of fs.readdirSync(uploadsDir)) {
      addRef(map, `/assets/uploads/${file}`, '_uploads');
    }
  }

  return [...map.values()].sort((a, b) => a.src.localeCompare(b.src, 'ru'));
}
