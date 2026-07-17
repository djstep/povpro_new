import fs from 'fs';
import path from 'path';
import type { Locale } from './i18n/config';
import { EN_PAGE_TITLES } from './i18n/page-titles';
import { ROUTES, pathToSlug } from './routes';

const contentDir = path.join(process.cwd(), 'content');

const SLUG_TO_FILE: Record<string, string> = {};
for (const route of Object.values(ROUTES)) {
  const file = route.slug === '' ? 'home.html' : `${route.slug.replace(/\//g, '__')}.html`;
  SLUG_TO_FILE[route.slug] = file;
}

export function getAllSlugs(): { slug: string[] | undefined }[] {
  return Object.values(ROUTES).map((r) => ({
    slug: r.slug === '' ? undefined : r.slug.split('/'),
  }));
}

export function getPageTitle(slug: string, locale: Locale = 'ru'): string {
  if (locale === 'en') {
    const enTitle = EN_PAGE_TITLES[slug];
    if (enTitle) return enTitle;
  }
  const key = slug === '' ? '/' : (`/${slug}` as keyof typeof ROUTES);
  const route = ROUTES[key as keyof typeof ROUTES];
  return route?.title ?? (locale === 'en' ? 'Page' : 'Страница');
}

export function getPageContent(slug: string, locale: Locale = 'ru'): string | null {
  const file = SLUG_TO_FILE[slug];
  if (!file) return null;

  if (locale === 'en') {
    const enPath = path.join(contentDir, 'en', file);
    if (fs.existsSync(enPath)) {
      return fs.readFileSync(enPath, 'utf8');
    }
  }

  const filePath = path.join(contentDir, file);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

export function normalizeSlugParam(slug?: string[]): string {
  if (!slug || slug.length === 0) return '';
  return slug.join('/');
}

export { pathToSlug };
