'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
const SCROLL_THRESHOLD = 24;

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
  const [scrolled, setScrolled] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const syncNavHeight = () => {
      if (window.scrollY > SCROLL_THRESHOLD) return;
      document.documentElement.style.setProperty('--site-nav-height', `${shell.offsetHeight}px`);
    };

    syncNavHeight();
    const ro = new ResizeObserver(syncNavHeight);
    ro.observe(shell);
    window.addEventListener('resize', syncNavHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncNavHeight);
    };
  }, []);

  useEffect(() => {
    if (scrolled) return;
    const shell = shellRef.current;
    if (!shell) return;
    document.documentElement.style.setProperty('--site-nav-height', `${shell.offsetHeight}px`);
  }, [scrolled]);

  return (
    <div
      ref={shellRef}
      className={`site-nav-shell${scrolled ? ' site-nav-shell--scrolled' : ''}`}
    >
      <nav
        className={`site-nav nav-glass-bar${scrolled ? ' nav-glass-bar--floating' : ''}`}
      >
        <div className="px-5 md:px-8 lg:px-margin-desktop py-3 md:py-4 flex justify-between items-center gap-4 max-w-container-max mx-auto w-full">
          <Link
            href="/"
            className="font-headline-lg-mobile text-primary font-black tracking-tighter text-[2rem] md:text-[2.5rem] leading-tight flex items-center gap-3 md:gap-4 no-underline shrink-0"
          >
            <Image src={LOGO} alt="ППО №3" width={48} height={48} className="w-10 h-10 md:w-12 md:h-12 object-contain" />
            ППО №3
          </Link>
          <div className="flex items-center gap-4 md:gap-6 min-w-0">
            <div className="hidden md:flex flex-col gap-2 min-w-0 items-center">
              <div className="flex items-center justify-center gap-4 lg:gap-6 flex-wrap">
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
              className="bg-primary text-on-primary rounded-full px-4 md:px-5 py-2.5 md:py-3 font-label-sm text-label-sm hover:opacity-90 uppercase tracking-widest font-bold no-underline shrink-0"
            >
              Запросить расчет
            </Link>
          </div>
        </div>
        <div className="hidden lg:block max-w-container-max mx-auto w-full">
          <div className="nav-bar-divider mx-5 md:mx-8 lg:mx-margin-desktop" aria-hidden="true" />
          <div className="px-5 md:px-8 lg:px-margin-desktop py-3 flex justify-center">
            <div className="flex items-center gap-3 xl:gap-5 flex-wrap justify-center">
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
    </div>
  );
}
