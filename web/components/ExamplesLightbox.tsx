'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ExampleItem = {
  src: string;
  alt: string;
};

const TRIGGER_SELECTOR = '[data-example-lightbox]';

function collectExamples(root: HTMLElement): ExampleItem[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TRIGGER_SELECTOR))
    .map((el) => {
      const img = el.querySelector('img');
      return {
        src: img?.currentSrc || img?.getAttribute('src') || img?.src || '',
        alt: img?.alt || '',
      };
    })
    .filter((item) => item.src);
}

export function ExamplesLightbox() {
  const [items, setItems] = useState<ExampleItem[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => setIndex(null), []);

  const showPrev = useCallback(() => {
    setIndex((current) => {
      if (current === null || items.length === 0) return current;
      return (current - 1 + items.length) % items.length;
    });
  }, [items.length]);

  const showNext = useCallback(() => {
    setIndex((current) => {
      if (current === null || items.length === 0) return current;
      return (current + 1) % items.length;
    });
  }, [items.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const root = document.querySelector('.site-content');
    if (!(root instanceof HTMLElement)) return;

    const refresh = () => setItems(collectExamples(root));
    refresh();

    const onClick = (e: Event) => {
      if (!(e.target instanceof Element)) return;
      const trigger = e.target.closest(TRIGGER_SELECTOR);
      if (!(trigger instanceof HTMLElement) || !root.contains(trigger)) return;

      e.preventDefault();
      e.stopPropagation();

      const examples = collectExamples(root);
      const nextIndex = Array.from(root.querySelectorAll(TRIGGER_SELECTOR)).indexOf(trigger);
      if (nextIndex < 0) return;

      setItems(examples);
      setIndex(nextIndex);
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (index === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showNext();
      }
    };

    document.addEventListener('keydown', onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prev;
    };
  }, [index, close, showPrev, showNext]);

  if (!mounted || index === null || !items[index]) return null;

  const item = items[index];
  const total = items.length;

  return createPortal(
    <div
      className="home-gallery-lightbox"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="home-gallery-lightbox__panel examples-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Пример работы ${index + 1} из ${total}`}
      >
        <button type="button" className="home-gallery-lightbox__close" onClick={close} aria-label="Закрыть просмотр">
          <span className="material-symbols-outlined">close</span>
        </button>

        {total > 1 && (
          <>
            <button
              type="button"
              className="home-gallery-lightbox__nav home-gallery-lightbox__nav--prev"
              onClick={showPrev}
              aria-label="Предыдущее фото"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              className="home-gallery-lightbox__nav home-gallery-lightbox__nav--next"
              onClick={showNext}
              aria-label="Следующее фото"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </>
        )}

        <figure className="home-gallery-lightbox__figure">
          <div className="home-gallery-lightbox__viewport examples-lightbox__viewport">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt={item.alt} className="examples-lightbox__img" />
          </div>
          {total > 1 && (
            <figcaption className="home-gallery-lightbox__caption">
              <span className="home-gallery-lightbox__counter">
                {index + 1} / {total}
              </span>
            </figcaption>
          )}
        </figure>
      </div>
    </div>,
    document.body,
  );
}
