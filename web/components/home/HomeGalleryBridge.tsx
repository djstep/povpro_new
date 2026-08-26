'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  ALL_HOME_GALLERY_ITEMS,
  homeGalleryImageUrl,
} from '@/lib/home-gallery';
import { HomeGalleryModal } from './HomeGalleryModal';

function isGalleryTrigger(el: Element): el is HTMLButtonElement {
  if (!(el instanceof HTMLButtonElement)) return false;
  if (el.dataset.homeGalleryOpen !== undefined) return true;
  return /смотреть\s+(все|всю\s+галере)/i.test(el.textContent ?? '');
}

function prefetchGalleryMedia() {
  const urls = new Set<string>();
  for (const item of ALL_HOME_GALLERY_ITEMS) {
    if (item.kind === 'image') {
      urls.add(homeGalleryImageUrl(item.id));
    } else {
      urls.add(item.src);
      if (item.poster) urls.add(item.poster);
    }
  }

  for (const url of urls) {
    if (url.endsWith('.mp4') || url.endsWith('.webm')) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = url;
      link.dataset.galleryPrefetch = '1';
      document.head.appendChild(link);
      // Параллельно прогреваем кэш через fetch
      void fetch(url, { credentials: 'same-origin', cache: 'force-cache' }).catch(() => {});
      continue;
    }
    const img = new window.Image();
    img.decoding = 'async';
    img.src = url;
  }
}

export function HomeGalleryBridge() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname !== '/' && pathname !== '/en') return;
    prefetchGalleryMedia();
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/' && pathname !== '/en') {
      setOpen(false);
      return;
    }

    const root = document.querySelector('.site-content');
    if (!root) return;

    const onClick = (e: Event) => {
      if (!(e.target instanceof Element)) return;
      const btn = e.target.closest('#manufacturing button');
      if (!btn || !isGalleryTrigger(btn)) return;
      e.preventDefault();
      setOpen(true);
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [pathname]);

  if (pathname !== '/' && pathname !== '/en') return null;

  return <HomeGalleryModal open={open} onClose={() => setOpen(false)} />;
}
