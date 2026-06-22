'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type CSSProperties } from 'react';
import {
  isActivePath,
  isMenuItemActive,
  type NavMenuItem,
} from '@/lib/navigation';
import { useSiteNavigation } from '@/components/layout/NavigationProvider';

type Props = {
  open: boolean;
  onClose: () => void;
};

type StaggerFn = () => number;

function menuItemStyle(index: number): CSSProperties {
  return { '--menu-stagger-index': index } as CSSProperties;
}

function slugFromPathname(pathname: string): string {
  if (pathname === '/') return '';
  return pathname.replace(/^\//, '');
}

function MobileMenuLink({
  href,
  label,
  currentSlug,
  onNavigate,
  stagger,
  indent = false,
}: {
  href: string;
  label: string;
  currentSlug: string;
  onNavigate: () => void;
  stagger: StaggerFn;
  indent?: boolean;
}) {
  const targetSlug = href === '/' ? '' : href.replace(/^\//, '');
  const active = isActivePath(currentSlug, targetSlug);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      style={menuItemStyle(stagger())}
      className={`mobile-menu-item mobile-menu-link block rounded-xl px-4 py-3 font-label-sm text-label-sm uppercase tracking-wider no-underline transition-colors ${
        indent ? 'pl-8' : ''
      } ${active ? 'text-primary bg-primary/10 border border-primary/20' : 'text-on-surface hover:bg-white/5 border border-transparent'}`}
    >
      {label}
    </Link>
  );
}

function MobileMenuGroup({
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
  const hasChildren = Boolean(item.children?.length);

  useEffect(() => {
    if (active) setExpanded(true);
  }, [active]);

  if (!hasChildren && item.href) {
    return (
      <MobileMenuLink
        href={item.href}
        label={item.label}
        currentSlug={currentSlug}
        onNavigate={onNavigate}
        stagger={stagger}
      />
    );
  }

  const rowIndex = stagger();

  return (
    <div className="flex flex-col gap-1">
      <div className="mobile-menu-item flex items-stretch gap-1" style={menuItemStyle(rowIndex)}>
        {item.href ? (
          <Link
            href={item.href}
            onClick={onNavigate}
            className={`mobile-menu-link flex-1 rounded-xl px-4 py-3 font-label-sm text-label-sm uppercase tracking-wider no-underline transition-colors ${
              active ? 'text-primary bg-primary/10 border border-primary/20' : 'text-on-surface hover:bg-white/5 border border-transparent'
            }`}
          >
            {item.label}
          </Link>
        ) : (
          <span className="flex-1 rounded-xl px-4 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
            {item.label}
          </span>
        )}
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? 'Свернуть' : 'Развернуть'}
          onClick={() => setExpanded((v) => !v)}
          className="mobile-menu-expand shrink-0 rounded-xl border border-white/10 px-3 text-on-surface-variant hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-xl">{expanded ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>
      {expanded && item.children && (
        <div className="flex flex-col gap-1 pl-2">
          {item.children.map((child) =>
            child.children?.length ? (
              <MobileMenuGroup
                key={child.label}
                item={child}
                currentSlug={currentSlug}
                onNavigate={onNavigate}
                stagger={stagger}
              />
            ) : (
              child.href && (
                <MobileMenuLink
                  key={child.href}
                  href={child.href}
                  label={child.label}
                  currentSlug={currentSlug}
                  onNavigate={onNavigate}
                  stagger={stagger}
                  indent
                />
              )
            )
          )}
        </div>
      )}
    </div>
  );
}

export function MobileMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const currentSlug = slugFromPathname(pathname);
  const { friction, mech, uslugi, topLinks } = useSiteNavigation();
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
      aria-label="Навигация по сайту"
      aria-hidden={!visible}
    >
      <button type="button" className="mobile-menu-backdrop fixed inset-0 z-[90]" aria-label="Закрыть меню" onClick={onClose} />
      <div className="mobile-menu-panel fixed z-[100] flex flex-col overflow-hidden">
        <div className="mobile-menu-handle shrink-0" aria-hidden="true" />
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 shrink-0">
          <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Меню</span>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="rounded-full p-2 text-on-surface-variant hover:bg-white/10">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <nav className="mobile-menu-nav flex flex-col gap-2 overflow-y-auto overscroll-contain px-4 py-4 flex-1">
          <MobileMenuLink href="/" label="Главная" currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} />
          <div className="pt-1 pb-1">
            <p
              className="mobile-menu-item px-4 py-1 font-mono-label text-mono-label text-primary uppercase tracking-widest"
              style={menuItemStyle(stagger())}
            >
              Фрикционные накладки
            </p>
            <div className="mt-1 flex flex-col gap-1">
              <MobileMenuLink href="/frikcionnye-nakladki" label="О разделе" currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} indent />
              {friction.map((item) =>
                item.href ? (
                  <MobileMenuLink key={item.href} href={item.href} label={item.label} currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} indent />
                ) : null
              )}
            </div>
          </div>
          <div className="pt-1 pb-1">
            <p
              className="mobile-menu-item px-4 py-1 font-mono-label text-mono-label text-primary uppercase tracking-widest"
              style={menuItemStyle(stagger())}
            >
              Мехобработка
            </p>
            <div className="mt-1 flex flex-col gap-1">
              <MobileMenuLink href="/mekhanicheskaya-obrabotka" label="Направления" currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} indent />
              {mech.map((item) => (
                <MobileMenuGroup key={item.label + (item.href ?? '')} item={item} currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} />
              ))}
            </div>
          </div>
          {topLinks.map((item) =>
            item.href ? (
              <MobileMenuLink key={item.href} href={item.href} label={item.label} currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} />
            ) : null,
          )}
          <div className="pt-1 pb-1">
            <p
              className="mobile-menu-item px-4 py-1 font-mono-label text-mono-label text-primary uppercase tracking-widest"
              style={menuItemStyle(stagger())}
            >
              Услуги
            </p>
            <div className="mt-1 flex flex-col gap-1">
              <MobileMenuLink href="/metalloobrabotka" label="Все услуги" currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} indent />
              {uslugi.map((item) =>
                item.href ? (
                  <MobileMenuLink key={item.href} href={item.href} label={item.label} currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} indent />
                ) : (
                  <MobileMenuGroup key={item.label} item={item} currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} />
                ),
              )}
            </div>
          </div>
          <MobileMenuLink href="/contacts" label="Контакты" currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} />
          <MobileMenuLink href="/otzyvy-o-ppo" label="Отзывы" currentSlug={currentSlug} onNavigate={onClose} stagger={stagger} />
        </nav>
        <div className="mobile-menu-footer shrink-0 border-t border-white/10 p-4">
          <Link
            href="/zakaz?from=mobile-menu"
            onClick={onClose}
            style={menuItemStyle(stagger())}
            className="mobile-menu-item flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-label-sm text-label-sm uppercase tracking-wider text-on-primary no-underline"
          >
            Сделать заказ
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
