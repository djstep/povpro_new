'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { parseLocaleFromPathname } from '@/lib/i18n/locale';
import { LocaleProvider } from './LocaleProvider';

export function LocaleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale } = parseLocaleFromPathname(pathname);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <LocaleProvider locale={locale}>{children}</LocaleProvider>;
}
