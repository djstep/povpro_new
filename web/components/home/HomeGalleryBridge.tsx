'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { HomeGalleryModal } from './HomeGalleryModal';

function isGalleryTrigger(el: Element): el is HTMLButtonElement {
  if (!(el instanceof HTMLButtonElement)) return false;
  if (el.dataset.homeGalleryOpen !== undefined) return true;
  return /смотреть\s+(все|всю\s+галере)/i.test(el.textContent ?? '');
}

export function HomeGalleryBridge() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname !== '/') {
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

  if (pathname !== '/') return null;

  return <HomeGalleryModal open={open} onClose={() => setOpen(false)} />;
}
