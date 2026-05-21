'use client';

import Link from 'next/link';
import type { NavLink } from '@/lib/navigation';
import { isActivePath } from '@/lib/navigation';

type Props = {
  href: string;
  label: string;
  items: NavLink[];
  currentSlug: string;
  prefixRe?: RegExp;
};

export function NavDropdown({ href, label, items, currentSlug, prefixRe }: Props) {
  const targetSlug = href === '/' ? '' : href.replace(/^\//, '');
  const mainActive = isActivePath(currentSlug, targetSlug, prefixRe);

  return (
    <div className="relative group shrink-0">
      <Link
        href={href}
        className={`${mainActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'} transition-colors font-label-sm text-label-sm uppercase tracking-widest whitespace-nowrap flex items-center gap-1`}
      >
        {label}
        <span className="material-symbols-outlined text-sm">expand_more</span>
      </Link>
      <div className="absolute left-0 top-full pt-2 hidden group-hover:block min-w-[300px] z-[100] pointer-events-auto">
        <div className="liquid-glass rounded-lg py-2 border border-white/10 shadow-xl max-h-[70vh] overflow-y-auto">
          {items.map((item) => {
            const childSlug = (item.href as string).replace(/^\//, '');
            const active = currentSlug === childSlug;
            return (
              <Link
                key={item.href}
                href={item.href as string}
                className={`block px-4 py-2 text-sm ${active ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
