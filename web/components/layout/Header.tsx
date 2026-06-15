'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { resolveAssetUrl } from '@/lib/resolve-asset-urls';
import {
  FRICTION_CHILDREN,
  MECH_CHILDREN,
  USLUGI_CHILDREN,
  MECH_PREFIX,
  USLUGI_PREFIX,
  isActivePath,
} from '@/lib/navigation';
import { NavDropdown } from './NavDropdown';

const LOGO = resolveAssetUrl('/assets/img/e345e1d85b71d21e.png');

function slugFromPathname(pathname: string): string {
  if (pathname === '/') return '';
  return pathname.replace(/^\//, '');
}

function NavLinkItem({
  href,
  label,
  currentSlug,
}: {
  href: string;
  label: string;
  currentSlug: string;
}) {
  const targetSlug = href === '/' ? '' : href.replace(/^\//, '');
  const active = isActivePath(currentSlug, targetSlug);
  return (
    <Link
      href={href}
      className={`${active ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-on-surface hover:text-primary font-bold'} transition-colors font-label-sm text-label-sm uppercase tracking-widest whitespace-nowrap`}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const currentSlug = slugFromPathname(pathname);
  return (
    <nav className="site-nav fixed top-0 left-0 w-full z-[100] bg-surface border-b border-white/10 flex flex-col overflow-visible isolate">
      <div className="border-b border-white/5">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center">
          <Link
            href="/"
            className="font-headline-lg-mobile text-primary font-black tracking-tighter text-[2.5rem] leading-tight flex items-center gap-4 no-underline"
          >
            <img src={LOGO} alt="ППО №3" width={48} height={48} className="w-12 h-12 object-contain" />
            ППО №3
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col gap-2 min-w-0 items-center">
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">mail</span>
                  <a
                    className="text-on-surface hover:text-primary font-label-sm text-label-sm font-bold whitespace-nowrap"
                    href="mailto:office@povpro.ru"
                  >
                    office@povpro.ru
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">call</span>
                  <a
                    className="text-on-surface hover:text-primary font-label-sm text-label-sm font-bold whitespace-nowrap"
                    href="tel:+78482555900"
                  >
                    8 (8482) 555-900
                  </a>
                </div>
              </div>
              <div className="border-t border-white/10 pt-2 w-full">
                <div className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">location_on</span>
                  <div className="text-on-surface font-label-sm text-label-sm font-bold whitespace-nowrap">
                    г. Тольятти, ул. Окраинная, 24
                  </div>
                </div>
              </div>
            </div>
            <Link
              href="/zakaz?from=header"
              className="bg-primary text-on-primary rounded-full px-5 py-3 font-label-sm text-label-sm hover:opacity-90 uppercase tracking-widest font-bold no-underline"
            >
              Запросить расчет
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden lg:block border-t border-white/5">
        <div className="max-w-container-max mx-auto px-margin-desktop py-3 flex justify-center">
          <div className="flex items-center gap-4 xl:gap-6 flex-wrap justify-center">
            <NavLinkItem href="/" label="Главная" currentSlug={currentSlug} />
            <NavDropdown
              href="/frikcionnye-nakladki"
              label="Фрикционные накладки"
              items={FRICTION_CHILDREN}
              currentSlug={currentSlug}
            />
            <NavDropdown
              href="/mekhanicheskaya-obrabotka"
              label="Мехобработка"
              items={MECH_CHILDREN}
              currentSlug={currentSlug}
              prefixRe={MECH_PREFIX}
            />
            <NavLinkItem href="/irt" label="Интеллектуальные системы" currentSlug={currentSlug} />
            <NavDropdown
              href="/metalloobrabotka"
              label="Услуги"
              items={USLUGI_CHILDREN}
              currentSlug={currentSlug}
              prefixRe={USLUGI_PREFIX}
            />
            <NavLinkItem href="/contacts" label="Контакты" currentSlug={currentSlug} />
            <NavLinkItem href="/otzyvy-o-ppo" label="Отзывы" currentSlug={currentSlug} />
          </div>
        </div>
      </div>
    </nav>
  );
}
