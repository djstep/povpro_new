import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ContactsMap } from '@/components/contacts/ContactsMap';
import { MldSpecsLightbox } from '@/components/mld/MldSpecsLightbox';
import { KpoEquipmentSearch } from '@/components/kpo/KpoEquipmentSearch';
import { HookahGallerySlider } from '@/components/hookah/HookahGallerySlider';
import { FrictionTablesEnhancer } from '@/components/friction/FrictionTablesEnhancer';
import { ReviewsPanel } from '@/components/reviews/ReviewsPanel';
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
        return (
          <>
            <SiteMain html={page.body} />
            {slugKey === 'frikcionnye-nakladki/nashi-izdeliya' && <FrictionTablesEnhancer />}
            {slugKey === 'otzyvy-o-ppo' && <ReviewsPanel />}
            {slugKey === 'contacts' && <ContactsMap />}
            {slugKey === 'izgotovlenie-kalyanovs' && <HookahGallerySlider />}
            {slugKey === 'remont-kuznechno-pressovogo-oborudovaniya' && <KpoEquipmentSearch />}
            {slugKey === 'mashiny-dlya-litya-pod-davleniem' && <MldSpecsLightbox />}
          </>
        );
      }
    } catch {
      /* fallback to file content */
    }
  }

  const html = getPageContent(slugKey);
  if (!html) notFound();

  return (
    <>
      <SiteMain html={html} />
      {slugKey === 'frikcionnye-nakladki/nashi-izdeliya' && <FrictionTablesEnhancer />}
      {slugKey === 'otzyvy-o-ppo' && <ReviewsPanel />}
      {slugKey === 'contacts' && <ContactsMap />}
      {slugKey === 'izgotovlenie-kalyanovs' && <HookahGallerySlider />}
      {slugKey === 'remont-kuznechno-pressovogo-oborudovaniya' && <KpoEquipmentSearch />}
      {slugKey === 'mashiny-dlya-litya-pod-davleniem' && <MldSpecsLightbox />}
    </>
  );
}
