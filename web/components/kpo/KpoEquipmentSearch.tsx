'use client';

import { useLayoutEffect } from 'react';

function matchesPrefix(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return name.trim().toLowerCase().startsWith(q);
}

function enhanceCatalog(root: HTMLElement): () => void {
  const input = root.querySelector<HTMLInputElement>('[data-kpo-search]');
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-kpo-equipment-item]'));
  if (!input || !items.length) return () => {};

  const update = () => {
    const query = input.value;
    const hasQuery = query.trim().length > 0;

    items.forEach((item) => {
      const name = item.textContent ?? '';
      const match = matchesPrefix(name, query);
      item.classList.toggle('is-dimmed', hasQuery && !match);
      item.classList.toggle('is-match', hasQuery && match);
    });
  };

  input.addEventListener('input', update);
  update();

  return () => input.removeEventListener('input', update);
}

export function KpoEquipmentSearch() {
  useLayoutEffect(() => {
    let cleanup = () => {};

    const run = () => {
      cleanup();
      const root = document.getElementById('kpo-equipment-catalog');
      cleanup = root ? enhanceCatalog(root) : () => {};
    };

    run();
    const retries = [50, 150].map((ms) => setTimeout(run, ms));

    return () => {
      retries.forEach(clearTimeout);
      cleanup();
    };
  }, []);

  return null;
}
