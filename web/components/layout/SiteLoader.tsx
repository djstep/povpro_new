'use client';

import { useEffect, useState } from 'react';

const SHOW_MS = 2000;
const FADE_MS = 400;

/**
 * Полноэкранный сплэш при первом открытии вкладки (root layout).
 * На клиентских переходах между страницами не показывается снова.
 */
export function SiteLoader() {
  const [phase, setPhase] = useState<'show' | 'fade' | 'done'>('show');

  useEffect(() => {
    const preferReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const showMs = preferReduced ? 400 : SHOW_MS;
    const fadeMs = preferReduced ? 150 : FADE_MS;

    const fadeTimer = window.setTimeout(() => setPhase('fade'), showMs);
    const doneTimer = window.setTimeout(() => setPhase('done'), showMs + fadeMs);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (phase === 'done') {
      document.body.style.overflow = '';
    }
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className={`site-loader${phase === 'fade' ? ' site-loader--fade' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy={phase !== 'done'}
      aria-label="Загрузка сайта"
    >
      <img
        src="/assets/img/povpro-loader-v2.webp"
        alt=""
        width={200}
        height={200}
        className="site-loader__mark"
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}
