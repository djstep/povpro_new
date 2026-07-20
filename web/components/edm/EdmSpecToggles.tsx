'use client';

import { useLayoutEffect } from 'react';

function bindSpecToggles(root: HTMLElement): () => void {
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-edm-spec-target]'));
  const handlers: Array<{ btn: HTMLButtonElement; fn: () => void }> = [];

  buttons.forEach((btn) => {
    const id = btn.getAttribute('data-edm-spec-target');
    if (!id) return;
    const panel = document.getElementById(id);
    if (!panel) return;

    const fn = () => {
      const isActive = panel.classList.contains('active');
      panel.classList.toggle('active', !isActive);
      btn.classList.toggle('active', !isActive);
    };

    btn.addEventListener('click', fn);
    handlers.push({ btn, fn });
  });

  return () => {
    handlers.forEach(({ btn, fn }) => btn.removeEventListener('click', fn));
  };
}

export function EdmSpecToggles() {
  useLayoutEffect(() => {
    let cleanup = () => {};

    const run = () => {
      cleanup();
      const root = document.querySelector('.site-content');
      cleanup = root instanceof HTMLElement ? bindSpecToggles(root) : () => {};
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
