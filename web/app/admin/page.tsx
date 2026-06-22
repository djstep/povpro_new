import Link from 'next/link';
import { isDbConfigured } from '@/lib/db';

export default function AdminHomePage() {
  const db = isDbConfigured();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Панель управления</h1>
      <div
        className={`rounded-lg border p-4 ${db ? 'border-emerald-800 bg-emerald-950/30' : 'border-amber-800 bg-amber-950/30'}`}
      >
        <p className="font-medium">{db ? 'База данных настроена' : 'База данных не подключена'}</p>
        <p className="text-sm text-zinc-400 mt-1">
          {db
            ? 'Редактирование контента, медиа, заявок и аналитики доступно через меню.'
            : 'Укажите DATABASE_URL в web/.env и выполните: npm run db:push'}
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        <li>
          <Link
            href="/admin/pages"
            className="block rounded-lg border border-zinc-800 p-4 hover:border-zinc-600"
          >
            <span className="font-medium">Страницы</span>
            <p className="text-sm text-zinc-500 mt-1">Создание, категории, контент</p>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/media"
            className="block rounded-lg border border-zinc-800 p-4 hover:border-zinc-600"
          >
            <span className="font-medium">Медиа</span>
            <p className="text-sm text-zinc-500 mt-1">Фото и видео на всех страницах</p>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/inquiries"
            className="block rounded-lg border border-zinc-800 p-4 hover:border-zinc-600"
          >
            <span className="font-medium">Заявки</span>
            <p className="text-sm text-zinc-500 mt-1">База обращений с сайта</p>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/analytics"
            className="block rounded-lg border border-zinc-800 p-4 hover:border-zinc-600"
          >
            <span className="font-medium">Аналитика</span>
            <p className="text-sm text-zinc-500 mt-1">Просмотры, клики, UTM для рекламы</p>
          </Link>
        </li>
      </ul>
    </div>
  );
}
