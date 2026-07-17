'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { MECH_PREFIX, USLUGI_PREFIX } from '@/lib/navigation';
import { useMobileMenu } from './MobileMenuProvider';
import { useLocale, useT } from '@/components/i18n/LocaleProvider';
import { localizedPath, parseLocaleFromPathname } from '@/lib/i18n/locale';

type Tab = {
  href: string;
  label: string;
  shortLabel: string;
  icon: string;
  isActive: (slug: string, path: string) => boolean;
};

export function MobileNav() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const t = useT();
  const { slugKey, pathWithoutLocale } = parseLocaleFromPathname(pathname);
  const { openMenu } = useMobileMenu();

  const tabs: Tab[] = useMemo(
    () => [
      {
        href: '/',
        label: t.nav.home,
        shortLabel: t.nav.home,
        icon: 'home',
        isActive: (slug) => slug === '',
      },
      {
        href: '/mekhanicheskaya-obrabotka',
        label: t.nav.machining,
        shortLabel: t.nav.machining,
        icon: 'precision_manufacturing',
        isActive: (_slug, path) => MECH_PREFIX.test(path),
      },
      {
        href: '/irt',
        label: t.nav.intelligentSystemsShort,
        shortLabel: t.nav.intelligentSystemsShort,
        icon: 'smart_toy',
        isActive: (slug) => slug === 'irt' || slug.startsWith('irt/'),
      },
      {
        href: '/metalloobrabotka',
        label: t.nav.services,
        shortLabel: t.nav.services,
        icon: 'settings',
        isActive: (slug, path) => USLUGI_PREFIX.test(path) || slug === 'metalloobrabotka',
      },
      {
        href: '/otzyvy-o-ppo',
        label: t.nav.reviews,
        shortLabel: t.nav.reviews,
        icon: 'reviews',
        isActive: (slug) => slug === 'otzyvy-o-ppo',
      },
      {
        href: '/contacts',
        label: t.nav.contacts,
        shortLabel: t.nav.contacts,
        icon: 'call',
        isActive: (slug) => slug === 'contacts',
      },
    ],
    [t],
  );

  return (
    <nav className="site-mobile-nav nav-glass-mobile md:hidden fixed bottom-0 left-0 right-0 z-50 pt-2 pb-3" aria-label={t.nav.quickNav}>
      <div className="site-mobile-nav-scroll flex items-end gap-0 overflow-x-auto overscroll-x-contain px-2 pb-1">
        {tabs.map((tab) => {
          const active = tab.isActive(slugKey, pathWithoutLocale);
          return (
            <Link
              key={tab.href}
              href={localizedPath(tab.href, locale)}
              className={`site-mobile-nav-tab flex min-w-[4.25rem] max-w-[5.5rem] flex-1 flex-col items-center px-1 py-1 no-underline ${
                active ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[22px] leading-none">{tab.icon}</span>
              <span className="mt-0.5 w-full truncate text-center text-[10px] leading-tight">{tab.shortLabel}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openMenu}
          className="site-mobile-nav-tab flex min-w-[4.25rem] max-w-[5.5rem] flex-1 flex-col items-center px-1 py-1 text-on-surface-variant"
          aria-label={t.nav.fullMenu}
        >
          <span className="material-symbols-outlined text-[22px] leading-none">menu</span>
          <span className="mt-0.5 w-full truncate text-center text-[10px] leading-tight">{t.nav.more}</span>
        </button>
      </div>
    </nav>
  );
}
