'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MECH_PREFIX, USLUGI_PREFIX } from '@/lib/navigation';

function slugFromPathname(pathname: string): string {
  if (pathname === '/') return '';
  return pathname.replace(/^\//, '');
}

export function MobileNav() {
  const pathname = usePathname();
  const slug = slugFromPathname(pathname);
  const path = '/' + slug;

  const home = slug === '' ? 'text-primary' : 'text-on-surface-variant';
  const uslugi = USLUGI_PREFIX.test(path) ? 'text-primary' : 'text-on-surface-variant';
  const mech = MECH_PREFIX.test(path) ? 'text-primary' : 'text-on-surface-variant';
  const contacts = slug === 'contacts' ? 'text-primary' : 'text-on-surface-variant';

  return (
    <nav className="site-mobile-nav lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-6 pt-2 bg-surface-container/95 border-t border-white/10">
      <Link className={`flex flex-col items-center px-3 py-1 ${home}`} href="/">
        <span className="material-symbols-outlined text-xl">home</span>
        <span className="text-xs">Главная</span>
      </Link>
      <Link className={`flex flex-col items-center px-3 py-1 ${uslugi}`} href="/metalloobrabotka">
        <span className="material-symbols-outlined text-xl">settings</span>
        <span className="text-xs">Услуги</span>
      </Link>
      <Link className={`flex flex-col items-center px-3 py-1 ${mech}`} href="/mekhanicheskaya-obrabotka">
        <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
        <span className="text-xs">Мехобработка</span>
      </Link>
      <Link className={`flex flex-col items-center px-3 py-1 ${contacts}`} href="/contacts">
        <span className="material-symbols-outlined text-xl">call</span>
        <span className="text-xs">Контакты</span>
      </Link>
    </nav>
  );
}
