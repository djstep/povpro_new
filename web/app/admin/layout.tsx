import Link from 'next/link';
import { isAdminAuthenticated, isAdminPasswordConfigured } from '@/lib/admin-auth';
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton';

export const metadata = {
  title: 'Админка',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const passwordRequired = isAdminPasswordConfigured();
  const authed = await isAdminAuthenticated();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6 flex-wrap">
          <Link href="/admin" className="font-semibold text-white">
            ППО №3 — Админка
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
            <Link href="/admin" className="hover:text-white">
              Обзор
            </Link>
            <Link href="/admin/pages" className="hover:text-white">
              Страницы
            </Link>
            <Link href="/admin/media" className="hover:text-white">
              Медиа
            </Link>
            <Link href="/admin/inquiries" className="hover:text-white">
              Заявки
            </Link>
            <Link href="/admin/analytics" className="hover:text-white">
              Аналитика
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {!passwordRequired && (
            <span className="text-xs text-amber-500">ADMIN_PASSWORD не задан</span>
          )}
          {passwordRequired && authed && <AdminLogoutButton />}
          <Link href="/" className="text-sm text-zinc-500 hover:text-white">
            На сайт →
          </Link>
        </div>
      </header>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
