import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ContactsMap } from '@/components/contacts/ContactsMap';
import { MldSpecsLightbox } from '@/components/mld/MldSpecsLightbox';
import { KpoEquipmentSearch } from '@/components/kpo/KpoEquipmentSearch';
import { HookahGallerySlider } from '@/components/hookah/HookahGallerySlider';
import { FrictionTablesEnhancer } from '@/components/friction/FrictionTablesEnhancer';
import { ReviewsPanel } from '@/components/reviews/ReviewsPanel';
import { SiteMain } from '@/components/SiteMain';
import { getPageTitle, normalizeSlugParam } from '@/lib/pages';
import { resolvePageHtml, getPageRecord } from '@/lib/cms/resolve-page-html';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug?: string[] }> };

export async function generateStaticParams() {
  const { getAllSiteSlugs } = await import('@/lib/cms/resolve-page-html');
  return getAllSiteSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const slugKey = normalizeSlugParam(slug);
  const record = await getPageRecord(slugKey);
  if (record?.metaTitle) return { title: record.metaTitle, description: record.metaDesc ?? undefined };
  if (record?.title) return { title: record.title, description: record.metaDesc ?? undefined };
  return { title: getPageTitle(slugKey) };
}

function PageEnhancers({ slugKey }: { slugKey: string }) {
  return (
    <>
      {slugKey === 'frikcionnye-nakladki/nashi-izdeliya' && <FrictionTablesEnhancer />}
      {slugKey === 'otzyvy-o-ppo' && <ReviewsPanel />}
      {slugKey === 'contacts' && <ContactsMap />}
      {slugKey === 'izgotovlenie-kalyanovs' && <HookahGallerySlider />}
      {slugKey === 'remont-kuznechno-pressovogo-oborudovaniya' && <KpoEquipmentSearch />}
      {slugKey === 'mashiny-dlya-litya-pod-davleniem' && <MldSpecsLightbox />}
    </>
  );
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const slugKey = normalizeSlugParam(slug);

  const html = await resolvePageHtml(slugKey);
  if (!html) notFound();

  return (
    <>
      <SiteMain html={html} />
      <PageEnhancers slugKey={slugKey} />
    </>
  );
}
