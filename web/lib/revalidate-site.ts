import { revalidatePath, revalidateTag } from 'next/cache';

/** Сброс кэша страниц, навигации и CMS-overrides после правок в админке. */
export function revalidateSiteContent(pageSlug?: string) {
  revalidatePath('/', 'layout');
  revalidateTag('pages');
  revalidateTag('cms-overrides');
  revalidateTag('site-navigation');
  if (pageSlug !== undefined) {
    revalidateTag(`page-${pageSlug === '' ? 'home' : pageSlug}`);
  }
}
