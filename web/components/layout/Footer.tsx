import Link from 'next/link';
import { SITE_CONTACTS } from '@/lib/site-contacts';

const NAV = [
  { href: '/', label: 'Главная' },
  { href: '/frikcionnye-nakladki', label: 'Фрикционные накладки' },
  { href: '/mekhanicheskaya-obrabotka', label: 'Мехобработка' },
  { href: '/metalloobrabotka', label: 'Услуги' },
];

const PRODUCTS = [
  { href: '/frikcionnye-nakladki/tu', label: 'Технические условия' },
  { href: '/frikcionnye-nakladki/nashi-izdeliya', label: 'Наши изделия' },
  { href: '/otzyvy-o-ppo', label: 'Отзывы' },
  { href: '/contacts', label: 'Контакты' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer bg-surface-container-lowest/95 w-full rounded-t-lg border-t border-white/10 mt-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop py-12 max-w-container-max mx-auto">
        <div className="flex flex-col gap-6">
          <div className="font-headline-lg text-headline-lg-mobile text-primary font-bold tracking-tighter">
            ППО №3
          </div>
          <p className="text-on-surface-variant text-body-md leading-relaxed">
            Промышленные фрикционные изделия. Лидер отрасли в разработке безасбестовых материалов.
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
          <span className="font-mono-label text-primary uppercase tracking-widest mb-2">Навигация</span>
          {NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-on-surface-variant hover:text-primary transition-all duration-200 font-label-sm text-label-sm uppercase tracking-widest"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-mono-label text-primary uppercase tracking-widest mb-2">Продукция</span>
          {PRODUCTS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-on-surface-variant hover:text-primary transition-all duration-200 font-label-sm text-label-sm uppercase tracking-widest"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-4 md:min-w-[19rem]">
          <span className="font-mono-label text-primary uppercase tracking-widest mb-2">Контакты</span>
          <div className="flex items-center gap-3 text-on-surface font-label-sm text-label-sm font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-primary scale-90 shrink-0">location_on</span>
            <span className="whitespace-nowrap">г. Тольятти, ул. Окраинная, 24</span>
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
          © {year} ППО №3 (POVPRO). Промышленное производство и инжиниринг. Все права защищены.
        </span>
        <Link
          href="/contacts"
          className="text-on-surface-variant text-mono-label hover:text-primary transition-colors font-label-sm text-label-sm uppercase tracking-widest"
        >
          Политика конфиденциальности
        </Link>
      </div>
    </footer>
  );
}
