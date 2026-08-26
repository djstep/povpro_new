'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveAssetUrl } from '@/lib/resolve-asset-urls';
import {
  MECH_PREFIX,
  USLUGI_PREFIX,
  isActivePath,
} from '@/lib/navigation';
import { useSiteNavigation } from '@/components/layout/NavigationProvider';
import { NavDropdown } from './NavDropdown';
import { useMobileMenu } from './MobileMenuProvider';
import { useLocale, useT } from '@/components/i18n/LocaleProvider';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { localizeNavConfig } from '@/lib/i18n/nav-localize';
import { localizedPath, parseLocaleFromPathname } from '@/lib/i18n/locale';

const LOGO = resolveAssetUrl('/assets/img/e345e1d85b71d21e.png');
const SCROLL_THRESHOLD = 24;

function slugFromHref(href: string): string {
  let path = href.split('?')[0] || '/';
  if (path === '/en' || path.startsWith('/en/')) {
    path = path === '/en' ? '/' : path.slice('/en'.length);
  }
  return path === '/' ? '' : path.replace(/^\//, '');
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
  const targetSlug = slugFromHref(href);
  const active = isActivePath(currentSlug, targetSlug);
  return (
    <Link
      href={href}
      className={`site-nav-link font-label-sm text-label-sm uppercase tracking-widest whitespace-nowrap${active ? ' site-nav-link--active' : ''}`}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const t = useT();
  const rawNav = useSiteNavigation();
  const nav = useMemo(() => localizeNavConfig(rawNav, locale, t), [rawNav, locale, t]);
  const { slugKey } = parseLocaleFromPathname(pathname);
  const currentSlug = slugKey;
  const { toggleMenu, open: menuOpen } = useMobileMenu();
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
      document.documentElement.style.setProperty('--site-nav-height', `${shell.offsetHeight}px`);
    };

    syncNavHeight();
    const ro = new ResizeObserver(syncNavHeight);
    ro.observe(shell);
    window.addEventListener('resize', syncNavHeight);
    window.addEventListener('scroll', syncNavHeight, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncNavHeight);
      window.removeEventListener('scroll', syncNavHeight);
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
        <div className="site-nav-top px-3 sm:px-5 md:px-8 lg:px-margin-desktop py-2.5 sm:py-3 md:py-4 flex justify-between items-center gap-2 sm:gap-4 max-w-container-max mx-auto w-full min-w-0">
          <Link
            href={localizedPath('/', locale)}
            className="site-nav-logo font-headline-lg-mobile text-primary font-black tracking-tighter text-[1.35rem] sm:text-[1.65rem] md:text-[2.5rem] leading-none flex items-center gap-2 sm:gap-3 md:gap-4 no-underline min-w-0 shrink overflow-visible"
          >
            <Image src={LOGO} alt={t.common.companyName} width={48} height={48} className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain shrink-0" />
            <span className="whitespace-nowrap overflow-visible pb-[0.12em]">{t.common.companyName}</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-6 min-w-0 shrink-0">
            <div className="hidden md:flex flex-col gap-2 min-w-0 items-center nav-contact-row">
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
                    {t.common.cityAddress}
                  </div>
                </div>
              </div>
            </div>
            <span className="hidden md:inline-flex">
              <LanguageSwitcher />
            </span>
            <button
              type="button"
              className={`site-nav-menu-btn md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface-container-high/80 text-on-surface shrink-0${menuOpen ? ' site-nav-menu-btn--open' : ''}`}
              aria-label={menuOpen ? t.header.closeMenu : t.header.openMenu}
              aria-expanded={menuOpen}
              onClick={toggleMenu}
            >
              <span className="site-nav-menu-icon site-nav-menu-icon--menu" aria-hidden="true">
                <span className="site-nav-burger">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
              <span className="site-nav-menu-icon site-nav-menu-icon--close" aria-hidden="true">
                <span className="site-nav-burger-close" />
              </span>
            </button>
            <Link
              href={localizedPath('/zakaz?from=header', locale)}
              className="site-nav-cta bg-primary text-on-primary rounded-full px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 font-label-sm text-label-sm hover:opacity-90 uppercase tracking-wider font-bold no-underline shrink-0 inline-flex items-center gap-1.5"
            >
              <span className="md:hidden">{t.header.orderShort}</span>
              <span className="hidden md:inline">{t.header.requestQuote}</span>
              <span className="material-symbols-outlined text-[18px] md:hidden">arrow_forward</span>
            </Link>
          </div>
        </div>
        <div className="hidden md:block max-w-container-max mx-auto w-full">
          <div className="nav-bar-divider mx-5 md:mx-8 lg:mx-margin-desktop" aria-hidden="true" />
          <div className="nav-row-scroll px-5 md:px-8 lg:px-margin-desktop py-3">
            <div className="nav-row-inner flex items-center gap-3 xl:gap-5 flex-wrap justify-center">
              <NavLinkItem href={localizedPath('/', locale)} label={t.nav.home} currentSlug={currentSlug} />
              <NavDropdown
                href={localizedPath('/mekhanicheskaya-obrabotka', locale)}
                label={t.nav.machining}
                items={nav.mech}
                currentSlug={currentSlug}
                prefixRe={MECH_PREFIX}
              />
              {nav.topLinks.map((item) =>
                item.href ? (
                  <NavLinkItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    currentSlug={currentSlug}
                  />
                ) : null,
              )}
              <NavDropdown
                href={localizedPath('/metalloobrabotka', locale)}
                label={t.nav.services}
                items={nav.uslugi}
                currentSlug={currentSlug}
                prefixRe={USLUGI_PREFIX}
              />
              <NavLinkItem href={localizedPath('/contacts', locale)} label={t.nav.contacts} currentSlug={currentSlug} />
              <NavLinkItem href={localizedPath('/otzyvy-o-ppo', locale)} label={t.nav.reviews} currentSlug={currentSlug} />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
