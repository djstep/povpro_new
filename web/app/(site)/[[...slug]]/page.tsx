import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SiteMain } from '@/components/SiteMain';
import { getAllSlugs, getPageContent, getPageTitle, normalizeSlugParam } from '@/lib/pages';
import { prisma, isDbConfigured } from '@/lib/db';

type Props = { params: Promise<{ slug?: string[] }> };

export async function generateStaticParams() {
  return getAllSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const slugKey = normalizeSlugParam(slug);
  const title = getPageTitle(slugKey);

  if (isDbConfigured()) {
    try {
      const page = await prisma.page.findUnique({ where: { slug: slugKey } });
      if (page?.metaTitle) return { title: page.metaTitle };
      if (page?.title) return { title: page.title };
    } catch {
      /* static fallback */
    }
  }

  return { title };
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const slugKey = normalizeSlugParam(slug);

  if (isDbConfigured()) {
    try {
      const page = await prisma.page.findUnique({
        where: { slug: slugKey, published: true },
      });
      if (page?.body) {
        return <SiteMain html={page.body} />;
      }
    } catch {
      /* fallback to file content */
    }
  }

  const html = getPageContent(slugKey);
  if (!html) notFound();

  return <SiteMain html={html} />;
}
