import Link from 'next/link';

export const metadata = {
  title: 'Страница не найдена',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background text-on-background">
      <p className="font-headline-xl text-[5rem] leading-none font-black text-primary">404</p>
      <h1 className="mt-4 font-headline-lg text-2xl md:text-3xl text-on-surface">
        Страница не найдена
      </h1>
      <p className="mt-3 max-w-md text-on-surface-variant">
        Возможно, страница была перемещена или её адрес указан неверно.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-label-sm uppercase tracking-widest text-on-primary transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        На главную
      </Link>
    </main>
  );
}
