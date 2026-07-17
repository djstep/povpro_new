'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  isActivePath,
  isMenuItemActive,
  MECH_PREFIX,
  USLUGI_PREFIX,
  type NavMenuItem,
} from '@/lib/navigation';
import { useSiteNavigation } from '@/components/layout/NavigationProvider';
import { useLocale, useT } from '@/components/i18n/LocaleProvider';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { localizeNavConfig } from '@/lib/i18n/nav-localize';
import { localizedPath, parseLocaleFromPathname } from '@/lib/i18n/locale';

type Props = {
  open: boolean;
  onClose: () => void;
};

type StaggerFn = () => number;

function menuItemStyle(index: number): CSSProperties {
  return { '--menu-stagger-index': index } as CSSProperties;
}

function MobileMenuLink({
  href,
  label,
  currentSlug,
  onNavigate,
  stagger,
  tone = 'default',
}: {
  href: string;
  label: string;
  currentSlug: string;
  onNavigate: () => void;
  stagger: StaggerFn;
  tone?: 'default' | 'category' | 'sub';
}) {
  const targetSlug = href === '/' ? '' : href.replace(/^\//, '');
  const active = isActivePath(currentSlug, targetSlug);
  const toneClass =
    tone === 'sub'
      ? active
        ? 'text-primary bg-primary/10 border border-primary/20'
        : 'text-on-surface-variant hover:bg-white/5 border border-transparent'
      : tone === 'category'
        ? active
          ? 'text-primary bg-primary/10 border border-primary/20'
          : 'text-primary border-transparent hover:bg-white/5'
        : active
          ? 'text-primary bg-primary/10 border border-primary/20'
          : 'text-on-surface hover:bg-white/5 border border-transparent';

  return (
    <Link
      href={href}
      onClick={onNavigate}
      style={menuItemStyle(stagger())}
      className={`mobile-menu-item mobile-menu-link block rounded-xl px-4 py-3 font-label-sm text-label-sm uppercase tracking-wider no-underline transition-colors ${toneClass}`}
    >
      {label}
    </Link>
  );
}

function MobileMenuDropdown({
  href,
  label,
  items,
  currentSlug,
  onNavigate,
  stagger,
  prefixRe,
}: {
  href: string;
  label: string;
  items: NavMenuItem[];
  currentSlug: string;
  onNavigate: () => void;
  stagger: StaggerFn;
  prefixRe?: RegExp;
}) {
  const active =
    isActivePath(currentSlug, href.replace(/^\//, ''), prefixRe) ||
    items.some((item) => isMenuItemActive(currentSlug, item));
  const [expanded, setExpanded] = useState(active);

  useEffect(() => {
    if (active) setExpanded(true);
  }, [active]);

  const rowIndex = stagger();

  return (
    <div className="flex flex-col gap-1">
      <div className="mobile-menu-item flex items-stretch gap-1" style={menuItemStyle(rowIndex)}>
        <Link
          href={href}
          onClick={onNavigate}
          className={`mobile-menu-link flex-1 rounded-xl px-4 py-3 font-label-sm text-label-sm uppercase tracking-wider no-underline transition-colors border ${
            active
              ? 'text-primary bg-primary/10 border-primary/20'
              : 'text-primary border-transparent hover:bg-white/5'
          }`}
        >
          {label}
        </Link>
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? `Свернуть «${label}»` : `Развернуть «${label}»`}
          onClick={() => setExpanded((v) => !v)}
          className="mobile-menu-expand shrink-0 rounded-full border border-white/10 text-primary hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-xl">{expanded ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-1 pl-3">
          {items.map((item) =>
            item.children?.length ? (
              <MobileMenuNestedGroup
                key={item.label + (item.href ?? '')}
                item={item}
                currentSlug={currentSlug}
                onNavigate={onNavigate}
                stagger={stagger}
              />
            ) : (
              item.href && (
                <MobileMenuLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  currentSlug={currentSlug}
                  onNavigate={onNavigate}
                  stagger={stagger}
                  tone="sub"
                />
              )
            ),
          )}
        </div>
      )}
    </div>
  );
}

function MobileMenuNestedGroup({
  item,
  currentSlug,
  onNavigate,
  stagger,
}: {
  item: NavMenuItem;
  currentSlug: string;
  onNavigate: () => void;
  stagger: StaggerFn;
}) {
  const active = isMenuItemActive(currentSlug, item);
  const [expanded, setExpanded] = useState(active);

  useEffect(() => {
    if (active) setExpanded(true);
  }, [active]);

  const rowIndex = stagger();

  return (
    <div className="flex flex-col gap-1">
      <div className="mobile-menu-item flex items-stretch gap-1" style={menuItemStyle(rowIndex)}>
        {item.href ? (
          <Link
            href={item.href}
            onClick={onNavigate}
            className={`mobile-menu-link flex-1 rounded-xl px-4 py-3 font-label-sm text-label-sm uppercase tracking-wider no-underline transition-colors border ${
              active
                ? 'text-primary bg-primary/10 border-primary/20'
                : 'text-on-surface-variant border-transparent hover:bg-white/5'
            }`}
          >
            {item.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex-1 rounded-xl px-4 py-3 text-left font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant border border-transparent hover:bg-white/5"
          >
            {item.label}
          </button>
        )}
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? `Свернуть «${item.label}»` : `Развернуть «${item.label}»`}
          onClick={() => setExpanded((v) => !v)}
          className="mobile-menu-expand shrink-0 rounded-full border border-white/10 text-on-surface-variant hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-xl">{expanded ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>
      {expanded && item.children && (
        <div className="flex flex-col gap-1 pl-3">
          {item.children.map(
            (child) =>
              child.href && (
                <MobileMenuLink
                  key={child.href}
                  href={child.href}
                  label={child.label}
                  currentSlug={currentSlug}
                  onNavigate={onNavigate}
                  stagger={stagger}
                  tone="sub"
                />
              ),
          )}
        </div>
      )}
    </div>
  );
}

export function MobileMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const t = useT();
  const rawNav = useSiteNavigation();
  const nav = useMemo(() => localizeNavConfig(rawNav, locale, t), [rawNav, locale, t]);
  const { slugKey } = parseLocaleFromPathname(pathname);
  const currentSlug = slugKey;
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 380);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  if (!mounted) return null;

  let staggerCounter = 0;
  const stagger: StaggerFn = () => staggerCounter++;

  return (
    <div
      className={`mobile-menu-root md:hidden${visible ? ' mobile-menu-root--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={t.nav.quickNav}
      aria-hidden={!visible}
    >
      <button type="button" className="mobile-menu-backdrop fixed inset-0 z-[90]" aria-label={t.header.closeMenu} onClick={onClose} />
      <div className="mobile-menu-panel fixed z-[100] flex flex-col overflow-hidden">
        <div className="mobile-menu-handle shrink-0" aria-hidden="true" />
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 shrink-0">
          <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{t.nav.fullMenu}</span>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button type="button" onClick={onClose} aria-label={t.header.closeMenu} className="rounded-full p-2 text-on-surface-variant hover:bg-white/10">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>
        <nav className="mobile-menu-nav flex flex-col gap-2 overflow-y-auto overscroll-contain px-4 py-4 flex-1">
          <MobileMenuLink href={localizedPath('/', locale)} label={t.nav.home} currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} tone="category" />

          <MobileMenuDropdown
            href={localizedPath('/mekhanicheskaya-obrabotka', locale)}
            label={t.nav.machining}
            items={nav.mech}
            currentSlug={currentSlug}
            onNavigate={onClose}
            stagger={stagger}
            prefixRe={MECH_PREFIX}
          />

          {nav.topLinks.map((item) =>
            item.href ? (
              <MobileMenuLink
                key={item.href}
                href={item.href}
                label={item.label}
                currentSlug={currentSlug}
                onNavigate={onClose}
                stagger={stagger}
                tone="category"
              />
            ) : null,
          )}

          <MobileMenuDropdown
            href={localizedPath('/metalloobrabotka', locale)}
            label={t.nav.services}
            items={nav.uslugi}
            currentSlug={currentSlug}
            onNavigate={onClose}
            stagger={stagger}
            prefixRe={USLUGI_PREFIX}
          />

          <MobileMenuLink href={localizedPath('/contacts', locale)} label={t.nav.contacts} currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} tone="category" />
          <MobileMenuLink href={localizedPath('/otzyvy-o-ppo', locale)} label={t.nav.reviews} currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} tone="category" />
        </nav>
        <div className="mobile-menu-footer shrink-0 border-t border-white/10 p-4">
          <Link
            href={localizedPath('/zakaz?from=mobile-menu', locale)}
            onClick={onClose}
            style={menuItemStyle(stagger())}
            className="mobile-menu-item flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-label-sm text-label-sm uppercase tracking-wider text-on-primary no-underline"
          >
            {t.header.requestQuote}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
