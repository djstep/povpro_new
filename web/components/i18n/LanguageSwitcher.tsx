'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { switchLocalePath } from '@/lib/i18n/locale';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const ruHref = switchLocalePath(pathname, 'ru');
  const enHref = switchLocalePath(pathname, 'en');

  return (
    <div
      className={`site-lang-switcher inline-flex items-center rounded-full border border-white/15 bg-surface-container-high/70 p-0.5 shrink-0 ${className}`}
      role="group"
      aria-label="Language"
    >
      <Link
        href={ruHref}
        hrefLang="ru"
        className={`site-lang-switcher__btn${locale === 'ru' ? ' site-lang-switcher__btn--active' : ''}`}
        aria-current={locale === 'ru' ? 'true' : undefined}
      >
        RU
      </Link>
      <Link
        href={enHref}
        hrefLang="en"
        className={`site-lang-switcher__btn${locale === 'en' ? ' site-lang-switcher__btn--active' : ''}`}
        aria-current={locale === 'en' ? 'true' : undefined}
      >
        EN
      </Link>
    </div>
  );
}
