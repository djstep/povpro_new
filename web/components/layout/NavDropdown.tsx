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

const HIDE_DELAY_MS = 200;

/** Подменю второго уровня — панель в portal */
function SubMenu({
  item,
  currentSlug,
  onFlyoutOpenChange,
}: {
  item: NavMenuItem;
  currentSlug: string;
  onFlyoutOpenChange?: (open: boolean) => void;
}) {
  const parentActive = isMenuItemActive(currentSlug, item);
  const rowRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const setFlyoutOpen = useCallback(
    (next: boolean) => {
      setOpen(next);
      onFlyoutOpenChange?.(next);
    },
    [onFlyoutOpenChange]
  );

  const updatePos = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const rect = row.getBoundingClientRect();
    const panel = row.closest('.nav-dropdown-panel');
    const anchorRight = panel ? panel.getBoundingClientRect().right : rect.right;
    setPos({ top: rect.top, left: anchorRight + 8 });
  }, []);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    updatePos();
    setFlyoutOpen(true);
  }, [setFlyoutOpen, updatePos]);

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => setFlyoutOpen(false), HIDE_DELAY_MS);
  }, [setFlyoutOpen]);

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
            className="nav-dropdown-flyout pointer-events-auto"
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 120 }}
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <div className="relative">
              <div
                className="absolute -left-2 top-0 h-full w-2"
                aria-hidden="true"
              />
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
  const triggerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flyoutOpenRef = useRef(false);
  const triggerHoveredRef = useRef(false);
  const panelHoveredRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  flyoutOpenRef.current = flyoutOpen;

  const panelVisible = menuOpen || flyoutOpen;

  const isMenuHovered = useCallback(
    () => triggerHoveredRef.current || panelHoveredRef.current,
    []
  );

  const updatePos = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.left });
  }, []);

  const showMenu = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    updatePos();
    setMenuOpen(true);
  }, [updatePos]);

  const scheduleClose = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!isMenuHovered() && !flyoutOpenRef.current) {
        setMenuOpen(false);
        setFlyoutOpen(false);
      }
    }, HIDE_DELAY_MS);
  }, [isMenuHovered]);

  useEffect(() => {
    if (!panelVisible) return;
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [panelVisible, updatePos]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  useEffect(() => {
    if (flyoutOpen && hideTimer.current) {
      clearTimeout(hideTimer.current);
      setMenuOpen(true);
    }
    if (!flyoutOpen) {
      scheduleClose();
    }
  }, [flyoutOpen, scheduleClose]);

  const dropdownPanel =
    panelVisible && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="nav-dropdown-root pointer-events-auto pt-1 -mt-1"
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 110 }}
            onMouseEnter={() => {
              panelHoveredRef.current = true;
              showMenu();
            }}
            onMouseLeave={() => {
              panelHoveredRef.current = false;
              scheduleClose();
            }}
          >
            <div className={`${PANEL} min-w-[300px]`}>
              {items.map((item) => {
                if (item.children?.length) {
                  return (
                    <SubMenu
                      key={item.label}
                      item={item}
                      currentSlug={currentSlug}
                      onFlyoutOpenChange={setFlyoutOpen}
                    />
                  );
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
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        ref={triggerRef}
        className={`relative shrink-0${panelVisible ? ' nav-dropdown-trigger--open' : ''}`}
        onMouseEnter={() => {
          triggerHoveredRef.current = true;
          showMenu();
        }}
        onMouseLeave={() => {
          triggerHoveredRef.current = false;
          scheduleClose();
        }}
      >
        <Link
          href={href}
          className={`site-nav-link font-label-sm text-label-sm uppercase tracking-widest whitespace-nowrap flex items-center gap-1${mainActive ? ' site-nav-link--active' : ''}`}
        >
          {label}
          <span className="material-symbols-outlined text-sm">expand_more</span>
        </Link>
      </div>
      {dropdownPanel}
    </>
  );
};
