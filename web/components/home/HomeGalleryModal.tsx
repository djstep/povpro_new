'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ALL_HOME_GALLERY_ITEMS,
  homeGalleryItemKey,
  type HomeGalleryItem,
} from '@/lib/home-gallery';
import { useGalleryMediaResolver } from './useGalleryImageResolver';

type Props = {
  open: boolean;
  onClose: () => void;
};

type GalleryCardProps = {
  item: HomeGalleryItem;
  index: number;
  posterSrc: string | undefined;
  onOpen: (index: number) => void;
};

function GalleryCard({ item, index, posterSrc, onOpen }: GalleryCardProps) {
  const isVideo = item.kind === 'video';

  return (
    <button
      type="button"
      className="home-gallery-modal__card"
      onClick={() => onOpen(index)}
      aria-label={isVideo ? `Открыть видео ${index + 1}` : `Открыть фото ${index + 1}`}
    >
      {posterSrc ? (
        <Image
          src={posterSrc}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="home-gallery-modal__img"
        />
      ) : (
        <div className="home-gallery-modal__img home-gallery-modal__video-placeholder" />
      )}
      {isVideo && (
        <span className="home-gallery-modal__play" aria-hidden="true">
          <span className="material-symbols-outlined">play_circle</span>
        </span>
      )}
    </button>
  );
}

type LightboxProps = {
  item: HomeGalleryItem;
  mediaSrc: string;
  posterSrc?: string;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

function GalleryLightbox({
  item,
  mediaSrc,
  posterSrc,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = item.kind === 'video';

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

  useEffect(() => {
    if (!isVideo) return;
    void videoRef.current?.play().catch(() => undefined);
  }, [isVideo, mediaSrc]);

  return createPortal(
    <div
      className="home-gallery-lightbox"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="home-gallery-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${isVideo ? 'Видео' : 'Фото'} ${index + 1} из ${total}`}
      >
        <button type="button" className="home-gallery-lightbox__close" onClick={onClose} aria-label="Закрыть просмотр">
          <span className="material-symbols-outlined">close</span>
        </button>

        {total > 1 && (
          <>
            <button
              type="button"
              className="home-gallery-lightbox__nav home-gallery-lightbox__nav--prev"
              onClick={onPrev}
              aria-label="Предыдущий элемент"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              className="home-gallery-lightbox__nav home-gallery-lightbox__nav--next"
              onClick={onNext}
              aria-label="Следующий элемент"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </>
        )}

        <figure className="home-gallery-lightbox__figure">
          <div className="home-gallery-lightbox__viewport">
            {isVideo ? (
              <video
                ref={videoRef}
                src={mediaSrc}
                poster={posterSrc}
                className="home-gallery-lightbox__video"
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <Image
                src={mediaSrc}
                alt=""
                fill
                sizes="96vw"
                className="home-gallery-lightbox__img"
                priority
              />
            )}
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

export function HomeGalleryModal({ open, onClose }: Props) {
  const { resolveImage, resolvePoster, resolveVideo } = useGalleryMediaResolver();
  const panelRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
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

  function cardPoster(item: HomeGalleryItem): string | undefined {
    if (item.kind === 'video') return resolvePoster(item.poster);
    return resolveImage(item.id);
  }

  function lightboxMedia(item: HomeGalleryItem): string {
    if (item.kind === 'video') return resolveVideo(item.src);
    return resolveImage(item.id);
  }

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
            <div className="home-gallery-modal__grid">
              {ALL_HOME_GALLERY_ITEMS.map((item, index) => (
                <GalleryCard
                  key={homeGalleryItemKey(item)}
                  item={item}
                  index={index}
                  posterSrc={cardPoster(item)}
                  onOpen={openLightbox}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {lightboxItem && lightboxIndex !== null && (
        <GalleryLightbox
          item={lightboxItem}
          mediaSrc={lightboxMedia(lightboxItem)}
          posterSrc={lightboxItem.kind === 'video' ? resolvePoster(lightboxItem.poster) : undefined}
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
