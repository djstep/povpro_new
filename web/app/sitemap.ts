import type { MetadataRoute } from 'next';
import { getAllSiteSlugs } from '@/lib/cms/resolve-page-html';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://povpro.ru';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let entries: { slug: string[] | undefined }[] = [];
  try {
    entries = await getAllSiteSlugs();
  } catch {
    entries = [{ slug: undefined }];
  }

  const now = new Date();

  return entries.map((entry) => {
    const path = entry.slug ? `/${entry.slug.join('/')}` : '';
    return {
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: entry.slug ? 0.7 : 1,
    };
  });
}
