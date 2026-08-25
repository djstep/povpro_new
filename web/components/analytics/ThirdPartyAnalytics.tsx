'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  getGaFormEvent,
  getGaMeasurementId,
  getYmCounterId,
  getYmFormGoal,
} from '@/lib/analytics/third-party';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
  }
}

const gaId = getGaMeasurementId();
const ymId = getYmCounterId();

function pagePath(pathname: string, search: string): string {
  return `${pathname}${search}`;
}

/** Sends SPA page views to GA4 and Yandex Metrika after client navigation. */
function SpPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    const search = searchParams.toString();
    const path = pagePath(pathname, search ? `?${search}` : '');
    if (lastSent.current === path) return;
    lastSent.current = path;

    if (gaId && typeof window.gtag === 'function') {
      window.gtag('config', gaId, { page_path: path });
    }

    if (ymId && typeof window.ym === 'function') {
      window.ym(ymId, 'hit', path);
    }
  }, [pathname, searchParams]);

  return null;
}

/** Loads GA4 + Yandex Metrika when IDs are set in env. */
export function ThirdPartyAnalyticsScripts() {
  if (!gaId && !ymId) return null;

  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { send_page_view: true });
            `}
          </Script>
        </>
      ) : null}

      {ymId ? (
        <Script id="ym-init" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
            ym(${ymId}, 'init', {
              clickmap: true,
              trackLinks: true,
              accurateTrackBounce: true,
              webvisor: true,
              ecommerce: 'dataLayer'
            });
          `}
        </Script>
      ) : null}
    </>
  );
}

export function ThirdPartyAnalytics() {
  if (!gaId && !ymId) return null;

  return (
    <>
      <ThirdPartyAnalyticsScripts />
      <SpPageViewTracker />
      {ymId ? (
        <noscript>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://mc.yandex.ru/watch/${ymId}`}
              style={{ position: 'absolute', left: '-9999px' }}
              alt=""
            />
          </div>
        </noscript>
      ) : null}
    </>
  );
}

/** Conversion: form submit → GA event + Yandex goal (for ads / remarketing). */
export function trackThirdPartyFormSubmit(source?: string) {
  const gaEvent = getGaFormEvent();
  const ymGoal = getYmFormGoal();
  const id = getYmCounterId();
  const ga = getGaMeasurementId();

  if (ga && typeof window.gtag === 'function') {
    window.gtag('event', gaEvent, {
      event_category: 'form',
      event_label: source || 'site',
    });
  }

  if (id && typeof window.ym === 'function') {
    window.ym(id, 'reachGoal', ymGoal, { source: source || 'site' });
  }
}
