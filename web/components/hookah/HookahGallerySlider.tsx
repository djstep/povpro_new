'use client';

import { useCallback, useEffect, useState } from 'react';

const SLIDES = [
  { src: '/assets/img/panda-mini-1.png', label: 'S.STEEL PANDA MINI' },
  { src: '/assets/img/panda-mini-2.png', label: 'S.STEEL PANDA MINI' },
  { src: '/assets/img/panda-1.png', label: 'S.STEEL PANDA' },
  { src: '/assets/img/panda-2.png', label: 'S.STEEL PANDA' },
];

export function HookahGallerySlider() {
  const [index, setIndex] = useState(0);
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRoot(document.getElementById('hookah-gallery-slider'));
  }, []);

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (!root) return;
    const prev = root.querySelector<HTMLButtonElement>('[data-hookah-prev]');
    const next = root.querySelector<HTMLButtonElement>('[data-hookah-next]');
    const onPrev = () => go(index - 1);
    const onNext = () => go(index + 1);
    prev?.addEventListener('click', onPrev);
    next?.addEventListener('click', onNext);
    return () => {
      prev?.removeEventListener('click', onPrev);
      next?.removeEventListener('click', onNext);
    };
  }, [root, index, go]);

  useEffect(() => {
    if (!root) return;
    const img = root.querySelector<HTMLImageElement>('[data-hookah-slide]');
    const label = root.querySelector<HTMLElement>('[data-hookah-label]');
    const dots = root.querySelectorAll<HTMLButtonElement>('[data-hookah-dot]');
    const slide = SLIDES[index];
    if (img) {
      img.src = slide.src;
      img.alt = slide.label;
    }
    if (label) label.textContent = slide.label;
    dots.forEach((dot, i) => {
      dot.classList.toggle('bg-on-surface', i === index);
      dot.classList.toggle('opacity-30', i !== index);
      dot.classList.toggle('bg-on-surface-variant', i !== index);
    });
  }, [root, index]);

  useEffect(() => {
    if (!root) return;
    const dots = root.querySelectorAll<HTMLButtonElement>('[data-hookah-dot]');
    const handlers: Array<() => void> = [];
    dots.forEach((dot, i) => {
      const handler = () => setIndex(i);
      handlers.push(handler);
      dot.addEventListener('click', handler);
    });
    return () => dots.forEach((dot, i) => dot.removeEventListener('click', handlers[i]!));
  }, [root]);

  return null;
}
