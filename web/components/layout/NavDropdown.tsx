'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { NavMenuItem } from '@/lib/navigation';
import { isActivePath, isMenuItemActive } from '@/lib/navigation';

type Props = {
  href: string;
  label: string;
  items: NavMenuItem[];
  currentSlug: string;
  prefixRe?: RegExp;
};

const PANEL =
  'nav-dropdown-panel liquid-glass rounded-lg py-2 border border-white/10 shadow-xl';

/** Подменю второго уровня — панель в portal, чтобы стекло не наслаивалось на родительское */
function SubMenu({ item, currentSlug }: { item: NavMenuItem; currentSlug: string }) {
  const parentActive = isMenuItemActive(currentSlug, item);
  const rowRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePos = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const rect = row.getBoundingClientRect();
    setPos({ top: rect.top, left: rect.right + 8 });
  }, []);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    updatePos();
    setOpen(true);
  }, [updatePos]);

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => setOpen(false), 120);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  const flyout =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={flyoutRef}
            className="nav-dropdown-flyout pointer-events-auto"
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 120 }}
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <div className={`${PANEL} whitespace-nowrap`}>
              {item.children!.map((child) => {
                if (!child.href) return null;
                const active = isMenuItemActive(currentSlug, child);
                return (
                  <Link
                    key={child.href as string}
                    href={child.href as string}
                    className={`block px-4 py-2 text-sm font-bold ${
                      active ? 'text-primary' : 'text-on-surface hover:text-primary'
                    }`}
                  >
                    {child.label}
                  </Link>
                );
              })}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        ref={rowRef}
        className="flex items-center justify-between px-4 py-2 cursor-pointer"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {item.href ? (
          <Link
            href={item.href as string}
            className={`text-sm font-label-sm font-bold uppercase tracking-widest ${
              parentActive ? 'text-primary' : 'text-on-surface hover:text-primary'
            }`}
          >
            {item.label}
          </Link>
        ) : (
          <span
            className={`text-sm font-label-sm font-bold uppercase tracking-widest ${
              parentActive ? 'text-primary' : 'text-on-surface'
            }`}
          >
            {item.label}
          </span>
        )}
        <span className="material-symbols-outlined text-sm text-on-surface/70 ml-2 flex-shrink-0">
          chevron_right
        </span>
      </div>
      {flyout}
    </>
  );
}

export function NavDropdown({ href, label, items, currentSlug, prefixRe }: Props) {
  const targetSlug = href === '/' ? '' : href.replace(/^\//, '');
  const mainActive = isActivePath(currentSlug, targetSlug, prefixRe);

  return (
    <div className="relative group shrink-0">
      <Link
        href={href}
        className={`${
          mainActive ? 'text-primary font-bold' : 'text-on-surface hover:text-primary font-bold'
        } transition-colors font-label-sm text-label-sm uppercase tracking-widest whitespace-nowrap flex items-center gap-1`}
      >
        {label}
        <span className="material-symbols-outlined text-sm">expand_more</span>
      </Link>

      <div className="absolute left-0 top-full pt-2 hidden group-hover:block min-w-[300px] z-[100] pointer-events-auto">
        <div className={PANEL}>
          {items.map((item) => {
            if (item.children?.length) {
              return <SubMenu key={item.label} item={item} currentSlug={currentSlug} />;
            }

            if (!item.href) return null;
            const active = isMenuItemActive(currentSlug, item);
            return (
              <Link
                key={item.href as string}
                href={item.href as string}
                className={`block px-4 py-2 text-sm font-bold ${
                  active ? 'text-primary' : 'text-on-surface hover:text-primary'
                }`}
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
