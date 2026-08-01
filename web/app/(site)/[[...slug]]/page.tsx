import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ContactsMap } from '@/components/contacts/ContactsMap';
import { MldSpecsLightbox } from '@/components/mld/MldSpecsLightbox';
import { ExamplesLightbox } from '@/components/ExamplesLightbox';
import { KpoEquipmentSearch } from '@/components/kpo/KpoEquipmentSearch';
import { EdmSpecToggles } from '@/components/edm/EdmSpecToggles';
import { FrictionTablesEnhancer } from '@/components/friction/FrictionTablesEnhancer';
import { ReviewsPanel } from '@/components/reviews/ReviewsPanel';
import { SiteReviews } from '@/components/reviews/SiteReviews';
import { SiteMain } from '@/components/SiteMain';
import { getPageTitle, getPageDescription } from '@/lib/pages';
import { parseLocaleFromSlug } from '@/lib/i18n/locale';
import { resolvePageHtml, getPageRecord } from '@/lib/cms/resolve-page-html';

// Страницы рендерятся статически и периодически ревалидируются (ISR).
// Правки в админке применяются сразу за счёт revalidatePath в API-роутах.
export const revalidate = 3600;

type Props = { params: Promise<{ slug?: string[] }> };

export async function generateStaticParams() {
  const { getAllSiteSlugs } = await import('@/lib/cms/resolve-page-html');
  const slugs = await getAllSiteSlugs();
  const params: { slug?: string[] }[] = [];

  for (const entry of slugs) {
    params.push(entry);
    params.push({ slug: entry.slug ? ['en', ...entry.slug] : ['en'] });
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale, slugKey } = parseLocaleFromSlug(slug);
  const record = await getPageRecord(slugKey);
  if (record?.metaTitle) return { title: record.metaTitle, description: record.metaDesc ?? undefined };
  if (record?.title) return { title: record.title, description: record.metaDesc ?? undefined };
  return {
    title: getPageTitle(slugKey, locale),
    description: getPageDescription(slugKey, locale),
  };
}

function PageEnhancers({ slugKey }: { slugKey: string }) {
  return (
    <>
      {slugKey === 'frikcionnye-nakladki/nashi-izdeliya' && <FrictionTablesEnhancer />}
      {slugKey === 'otzyvy-o-ppo' && <SiteReviews />}
      {slugKey === 'otzyvy-o-ppo' && <ReviewsPanel />}
      {slugKey === 'contacts' && <ContactsMap />}
      {slugKey === 'remont-kuznechno-pressovogo-oborudovaniya' && <KpoEquipmentSearch />}
      {slugKey === 'elektroerozionnye-raboty' && <EdmSpecToggles />}
      {slugKey === 'mashiny-dlya-litya-pod-davleniem' && <MldSpecsLightbox />}
      {(slugKey === 'tokarnye-raboty' ||
        slugKey === 'frezernye-raboty' ||
        slugKey === 'shlifovalnye-raboty' ||
        slugKey === 'mekhanicheskaya-obrabotka') && <ExamplesLightbox />}
    </>
  );
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const { locale, slugKey } = parseLocaleFromSlug(slug);

  const html = await resolvePageHtml(slugKey, locale);
  if (!html) notFound();

  return (
    <>
      <SiteMain html={html} />
      <PageEnhancers slugKey={slugKey} />
    </>
  );
}
