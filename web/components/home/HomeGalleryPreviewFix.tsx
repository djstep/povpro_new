'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { homeGalleryImageUrl } from '@/lib/home-gallery';

/** ID превью на главной — должны совпадать с web/content/home.html */
const PREVIEW_GALLERY_IDS = [2, 4, 18] as const;

/** Подставляет локальные URL в 3 превью-карточки (SSR мог записать старый povpro.ru/views/…). */
export function HomeGalleryPreviewFix() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/' && pathname !== '/en') return;

    const imgs = document.querySelectorAll('#manufacturing .home-gallery-card img');
    imgs.forEach((node, index) => {
      const id = PREVIEW_GALLERY_IDS[index];
      if (!(node instanceof HTMLImageElement) || id === undefined) return;
      node.src = homeGalleryImageUrl(id);
      node.loading = index === 0 ? 'eager' : 'lazy';
    });
  }, [pathname]);

  return null;
}
