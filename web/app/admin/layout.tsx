import Link from 'next/link';

export const metadata = {
  title: 'Админка',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-semibold text-white">
            ППО №3 — Админка
          </Link>
          <nav className="flex gap-4 text-sm text-zinc-400">
            <Link href="/admin" className="hover:text-white">
              Обзор
            </Link>
            <Link href="/admin/pages" className="hover:text-white">
              Страницы
            </Link>
            <Link href="/admin/inquiries" className="hover:text-white">
              Заявки
            </Link>
          </nav>
        </div>
        <Link href="/" className="text-sm text-zinc-500 hover:text-white">
          На сайт →
        </Link>
      </header>
      <main className="p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
