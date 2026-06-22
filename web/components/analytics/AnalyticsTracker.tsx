'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const SESSION_KEY = 'ppo_analytics_sid';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function readUtm(searchParams: URLSearchParams) {
  return {
    utmSource: searchParams.get('utm_source') ?? undefined,
    utmMedium: searchParams.get('utm_medium') ?? undefined,
    utmCampaign: searchParams.get('utm_campaign') ?? undefined,
    utmContent: searchParams.get('utm_content') ?? undefined,
    utmTerm: searchParams.get('utm_term') ?? undefined,
  };
}

function track(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }));
    return;
  }
  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  });
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const utm = readUtm(searchParams);
    track({
      sessionId: getSessionId(),
      eventType: 'PAGE_VIEW',
      path: pathname,
      referrer: document.referrer || undefined,
      ...utm,
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest('a[href]') as HTMLAnchorElement | null;
      const button = target.closest('button, [role="button"]') as HTMLElement | null;
      const el = link ?? button;
      if (!el) return;

      const href = link?.getAttribute('href') ?? '';
      const text = (el.textContent ?? '').trim().slice(0, 120);
      const isCta =
        href.includes('/zakaz') ||
        el.classList.contains('bg-primary') ||
        /заказ|расчёт|расчет|консультац/i.test(text);

      if (!isCta && !href) return;

      track({
        sessionId: getSessionId(),
        eventType: isCta ? 'CTA_CLICK' : 'CLICK',
        path: pathname,
        metadata: { href, text },
        ...readUtm(searchParams),
      });
    }

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [pathname, searchParams]);

  return null;
}

export function trackFormSubmit(source: string) {
  track({
    sessionId: getSessionId(),
    eventType: 'FORM_SUBMIT',
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    metadata: { source },
  });
}
