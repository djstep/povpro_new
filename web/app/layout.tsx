import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'ППО №3 — Поволжское производственное объединение',
    template: '%s — ППО №3',
  },
  description:
    'Металлообработка, фрикционные накладки, мехобработка, ремонт оборудования. г. Тольятти.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`dark ${geist.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="selection:bg-primary-container selection:text-on-primary-container">
        {children}
      </body>
    </html>
  );
}
