'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MECH_PREFIX, USLUGI_PREFIX } from '@/lib/navigation';
import { useMobileMenu } from './MobileMenuProvider';

function slugFromPathname(pathname: string): string {
  if (pathname === '/') return '';
  return pathname.replace(/^\//, '');
}

type Tab = {
  href: string;
  label: string;
  shortLabel: string;
  icon: string;
  isActive: (slug: string, path: string) => boolean;
};

const TABS: Tab[] = [
  { href: '/', label: 'Главная', shortLabel: 'Главная', icon: 'home', isActive: (slug) => slug === '' },
  {
    href: '/frikcionnye-nakladki',
    label: 'Фрикционы',
    shortLabel: 'Фрикционы',
    icon: 'layers',
    isActive: (slug) => slug.startsWith('frikcionnye-nakladki'),
  },
  {
    href: '/mekhanicheskaya-obrabotka',
    label: 'Мехобработка',
    shortLabel: 'Мехобр.',
    icon: 'precision_manufacturing',
    isActive: (slug, path) => MECH_PREFIX.test(path),
  },
  {
    href: '/irt',
    label: 'ИРТ',
    shortLabel: 'ИРТ',
    icon: 'smart_toy',
    isActive: (slug) => slug === 'irt' || slug.startsWith('irt/'),
  },
  {
    href: '/metalloobrabotka',
    label: 'Услуги',
    shortLabel: 'Услуги',
    icon: 'settings',
    isActive: (slug, path) => USLUGI_PREFIX.test(path) || slug === 'metalloobrabotka',
  },
  {
    href: '/otzyvy-o-ppo',
    label: 'Отзывы',
    shortLabel: 'Отзывы',
    icon: 'reviews',
    isActive: (slug) => slug === 'otzyvy-o-ppo',
  },
  {
    href: '/contacts',
    label: 'Контакты',
    shortLabel: 'Контакты',
    icon: 'call',
    isActive: (slug) => slug === 'contacts',
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const slug = slugFromPathname(pathname);
  const path = '/' + slug;
  const { openMenu } = useMobileMenu();

  return (
    <nav className="site-mobile-nav nav-glass-mobile md:hidden fixed bottom-0 left-0 right-0 z-50 pt-2 pb-3" aria-label="Быстрая навигация">
      <div className="site-mobile-nav-scroll flex items-end gap-0 overflow-x-auto overscroll-x-contain px-2 pb-1">
        {TABS.map((tab) => {
          const active = tab.isActive(slug, path);
          return (
            <Link
              key={tab.href}
              href={tab.href}
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
          aria-label="Полное меню"
        >
          <span className="material-symbols-outlined text-[22px] leading-none">menu</span>
          <span className="mt-0.5 w-full truncate text-center text-[10px] leading-tight">Ещё</span>
        </button>
      </div>
    </nav>
  );
}
