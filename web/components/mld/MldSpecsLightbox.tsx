'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const SPECS_SRC = '/assets/img/mld-tst-specs.jpg';
const SPECS_ALT = 'Технические характеристики литейных машин серии TST';

export function MldSpecsLightbox() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cleanup = () => {};

    const bind = () => {
      cleanup();
      const triggers = document.querySelectorAll('[data-mld-specs-trigger]');
      if (!triggers.length) return;
      const handlers: Array<() => void> = [];
      triggers.forEach((trigger) => {
        const onClick = (e: Event) => {
          e.preventDefault();
          setOpen(true);
        };
        trigger.addEventListener('click', onClick);
        handlers.push(() => trigger.removeEventListener('click', onClick));
      });
      cleanup = () => handlers.forEach((off) => off());
    };

    bind();
    const retries = [50, 150].map((ms) => setTimeout(bind, ms));

    return () => {
      retries.forEach(clearTimeout);
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="home-gallery-lightbox"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        className="home-gallery-lightbox__panel mld-specs-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-label={SPECS_ALT}
      >
        <button
          type="button"
          className="home-gallery-lightbox__close"
          onClick={() => setOpen(false)}
          aria-label="Закрыть просмотр"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <figure className="home-gallery-lightbox__figure">
          <div className="home-gallery-lightbox__viewport mld-specs-lightbox__viewport">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SPECS_SRC} alt={SPECS_ALT} className="mld-specs-lightbox__img" />
          </div>
          <figcaption className="home-gallery-lightbox__caption">
            <span className="home-gallery-lightbox__title">{SPECS_ALT}</span>
          </figcaption>
        </figure>
      </div>
    </div>,
    document.body,
  );
}
