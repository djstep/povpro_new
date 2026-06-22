'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ALL_HOME_GALLERY_ITEMS,
  HOME_GALLERY_SECTIONS,
  type HomeGalleryItem,
} from '@/lib/home-gallery';
import { useGalleryImageResolver } from './useGalleryImageResolver';

type Props = {
  open: boolean;
  onClose: () => void;
};

type GalleryCardProps = {
  item: HomeGalleryItem;
  imageSrc: string;
  onOpen: (item: HomeGalleryItem) => void;
};

function GalleryCard({ item, imageSrc, onOpen }: GalleryCardProps) {
  return (
    <button
      type="button"
      className="home-gallery-modal__card"
      onClick={() => onOpen(item)}
      aria-label={`Открыть: ${item.title}`}
    >
      <Image
        src={imageSrc}
        alt={item.title}
        fill
        sizes="(max-width: 640px) 100vw, 33vw"
        className="home-gallery-modal__img"
      />
      <span className="home-gallery-modal__caption">
        <span className="home-gallery-modal__tag">{item.tag}</span>
        <span className="home-gallery-modal__title">{item.title}</span>
      </span>
    </button>
  );
}

type LightboxProps = {
  item: HomeGalleryItem;
  imageSrc: string;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

function GalleryLightbox({ item, imageSrc, index, total, onClose, onPrev, onNext }: LightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      }
    },
    [onClose, onPrev, onNext],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  return createPortal(
    <div
      className="home-gallery-lightbox"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="home-gallery-lightbox__panel" role="dialog" aria-modal="true" aria-label={item.title}>
        <button type="button" className="home-gallery-lightbox__close" onClick={onClose} aria-label="Закрыть просмотр">
          <span className="material-symbols-outlined">close</span>
        </button>

        {total > 1 && (
          <>
            <button
              type="button"
              className="home-gallery-lightbox__nav home-gallery-lightbox__nav--prev"
              onClick={onPrev}
              aria-label="Предыдущее фото"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              className="home-gallery-lightbox__nav home-gallery-lightbox__nav--next"
              onClick={onNext}
              aria-label="Следующее фото"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </>
        )}

        <figure className="home-gallery-lightbox__figure">
          <div className="home-gallery-lightbox__viewport">
            <Image
              src={imageSrc}
              alt={item.title}
              fill
              sizes="96vw"
              className="home-gallery-lightbox__img"
              priority
            />
          </div>
          <figcaption className="home-gallery-lightbox__caption">
            <span className="home-gallery-lightbox__tag">{item.tag}</span>
            <span className="home-gallery-lightbox__title">{item.title}</span>
            {total > 1 && (
              <span className="home-gallery-lightbox__counter">
                {index + 1} / {total}
              </span>
            )}
          </figcaption>
        </figure>
      </div>
    </div>,
    document.body,
  );
}

export function HomeGalleryModal({ open, onClose }: Props) {
  const resolveGalleryImage = useGalleryImageResolver();
  const panelRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const openLightbox = useCallback((item: HomeGalleryItem) => {
    const index = ALL_HOME_GALLERY_ITEMS.findIndex((entry) => entry.id === item.id);
    setLightboxIndex(index >= 0 ? index : 0);
  }, []);

  const goPrev = useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null) return null;
      return (current - 1 + ALL_HOME_GALLERY_ITEMS.length) % ALL_HOME_GALLERY_ITEMS.length;
    });
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null) return null;
      return (current + 1) % ALL_HOME_GALLERY_ITEMS.length;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex !== null) return;
      if (e.key === 'Escape') onClose();
    },
    [lightboxIndex, onClose],
  );

  useEffect(() => {
    if (!open) {
      setLightboxIndex(null);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const lightboxItem = lightboxIndex !== null ? ALL_HOME_GALLERY_ITEMS[lightboxIndex] : null;

  return createPortal(
    <>
      <div
        className="home-gallery-modal"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          className="home-gallery-modal__panel liquid-glass"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-gallery-modal-title"
          tabIndex={-1}
        >
          <header className="home-gallery-modal__header">
            <div>
              <p className="home-gallery-modal__eyebrow font-mono-label text-mono-label uppercase tracking-widest text-primary">
                Галерея
              </p>
              <h2 id="home-gallery-modal-title" className="home-gallery-modal__heading">
                Производство в деталях
              </h2>
              <p className="home-gallery-modal__subtitle">
                Примеры нашей продукции и производственных мощностей.
              </p>
            </div>
            <button
              type="button"
              className="home-gallery-modal__close"
              onClick={onClose}
              aria-label="Закрыть галерею"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          <div className="home-gallery-modal__body">
            {HOME_GALLERY_SECTIONS.map((section) => (
              <section key={section.id} className="home-gallery-modal__section">
                <div className="home-gallery-modal__section-head">
                  <h3 className="home-gallery-modal__section-title">{section.title}</h3>
                  <p className="home-gallery-modal__section-desc">{section.description}</p>
                </div>
                <div className="home-gallery-modal__grid">
                  {section.items.map((item) => (
                    <GalleryCard
                      key={item.id}
                      item={item}
                      imageSrc={resolveGalleryImage(item.id)}
                      onOpen={openLightbox}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {lightboxItem && lightboxIndex !== null && (
        <GalleryLightbox
          item={lightboxItem}
          imageSrc={resolveGalleryImage(lightboxItem.id)}
          index={lightboxIndex}
          total={ALL_HOME_GALLERY_ITEMS.length}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </>,
    document.body,
  );
}
