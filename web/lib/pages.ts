import fs from 'fs';
import path from 'path';
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

export function getPageTitle(slug: string): string {
  const key = slug === '' ? '/' : (`/${slug}` as keyof typeof ROUTES);
  const route = ROUTES[key as keyof typeof ROUTES];
  return route?.title ?? 'Страница';
}

export function getPageContent(slug: string): string | null {
  const file = SLUG_TO_FILE[slug];
  if (!file) return null;
  const filePath = path.join(contentDir, file);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

export function normalizeSlugParam(slug?: string[]): string {
  if (!slug || slug.length === 0) return '';
  return slug.join('/');
}

export { pathToSlug };
