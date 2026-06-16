import type { Metadata } from 'next';
import { geistSans } from '@/lib/fonts';
import './globals.css';

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
    <html lang="ru" className={`dark ${geistSans.variable}`}>
      <body className={`${geistSans.className} selection:bg-primary-container selection:text-on-primary-container`}>
        {children}
      </body>
    </html>
  );
}
