'use client';

import { useEffect } from 'react';

const YANDEX_MAP_SCRIPT =
  'https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3Ab664c96537c7f4bbc8f426dae9cfd0cce58736161a6c0f1ab01d6561df2b2dbc&width=100%25&height=700&lang=ru_RU&scroll=true';

/** Виджет карты из конструктора Яндекса на странице контактов */
export function ContactsMap() {
  useEffect(() => {
    const anchor = document.getElementById('contacts-map-anchor');
    if (!anchor || anchor.dataset.mapLoaded === 'true') return;

    anchor.dataset.mapLoaded = 'true';
    anchor.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.async = true;
    script.src = YANDEX_MAP_SCRIPT;
    anchor.appendChild(script);

    return () => {
      delete anchor.dataset.mapLoaded;
      anchor.innerHTML = '';
    };
  }, []);

  return null;
}
