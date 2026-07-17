'use client';

import Link from 'next/link';
import { SITE_CONTACTS } from '@/lib/site-contacts';
import { useLocale, useT } from '@/components/i18n/LocaleProvider';
import { localizedPath } from '@/lib/i18n/locale';

export function Footer() {
  const { locale } = useLocale();
  const t = useT();
  const year = new Date().getFullYear();

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/mekhanicheskaya-obrabotka', label: t.nav.machining },
    { href: '/metalloobrabotka', label: t.nav.services },
    { href: '/irt', label: t.nav.intelligentSystems },
    { href: '/otzyvy-o-ppo', label: t.nav.reviews },
    { href: '/contacts', label: t.nav.contacts },
  ];

  const productLinks = [
    { href: '/proizvodstvo-press-form-i-shtampov', label: t.nav.diesAndMolds },
    { href: '/izgotovlenie-valov', label: t.nav.shafts },
    { href: '/izgotovlenie-shesteren-i-zubchatyh-koles', label: t.nav.gearsAndPinions },
  ];

  return (
    <footer className="site-footer bg-surface-container-lowest/95 w-full rounded-t-lg border-t border-white/10 mt-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop py-12 max-w-container-max mx-auto">
        <div className="flex flex-col gap-6">
          <div className="font-headline-lg text-headline-lg-mobile text-primary font-bold tracking-tighter">
            {t.common.companyName}
          </div>
          <p className="text-on-surface-variant text-body-md leading-relaxed">
            {t.footer.tagline}
          </p>
          <div className="flex items-center gap-3">
            <a
              href={SITE_CONTACTS.telegram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="footer-social-link"
            >
              <img src="/assets/icons/telegram.svg" alt="" width={24} height={24} className="w-6 h-6" />
            </a>
            <a
              href={SITE_CONTACTS.maxMessenger}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="MAX"
              className="footer-social-link"
            >
              <img src="/assets/icons/max-messenger.svg" alt="" width={24} height={24} className="w-6 h-6" />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-mono-label text-primary uppercase tracking-widest mb-2">{t.footer.navigation}</span>
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={localizedPath(l.href, locale)}
              className="text-on-surface-variant hover:text-primary transition-all duration-200 font-label-sm text-label-sm uppercase tracking-widest"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-mono-label text-primary uppercase tracking-widest mb-2">{t.footer.products}</span>
          {productLinks.map((l) => (
            <Link
              key={l.href}
              href={localizedPath(l.href, locale)}
              className="text-on-surface-variant hover:text-primary transition-all duration-200 font-label-sm text-label-sm uppercase tracking-widest"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-4 md:min-w-[19rem]">
          <span className="font-mono-label text-primary uppercase tracking-widest mb-2">{t.footer.contacts}</span>
          <div className="flex items-center gap-3 text-on-surface font-label-sm text-label-sm font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-primary scale-90 shrink-0">location_on</span>
            <span className="whitespace-nowrap">{t.common.cityAddress}</span>
          </div>
          <a
            href="tel:+78482555900"
            className="flex items-center gap-3 text-on-surface font-label-sm text-label-sm font-bold uppercase tracking-widest hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-primary scale-90 shrink-0">phone</span>
            <span className="break-words">8 (8482) 555-900</span>
          </a>
          <a
            href="mailto:office@povpro.ru"
            className="flex items-center gap-3 text-on-surface font-label-sm text-label-sm font-bold uppercase tracking-widest hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-primary scale-90 shrink-0">mail</span>
            <span className="break-all">office@povpro.ru</span>
          </a>
        </div>
      </div>

      <div className="px-margin-mobile md:px-margin-desktop py-8 border-t border-white/5 max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-on-surface-variant text-mono-label">
          © {year} {t.common.companyName} (POVPRO). {t.footer.copyright}
        </span>
        <Link
          href={localizedPath('/policy', locale)}
          className="text-on-surface-variant text-mono-label hover:text-primary transition-colors font-label-sm text-label-sm uppercase tracking-widest"
        >
          {t.footer.privacyPolicy}
        </Link>
      </div>
    </footer>
  );
}
