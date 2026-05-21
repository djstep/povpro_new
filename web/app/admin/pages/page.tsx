import { ROUTES } from '@/lib/routes';
import { isDbConfigured, prisma } from '@/lib/db';

export default async function AdminPagesPage() {
  let dbPages: { slug: string; title: string; updatedAt: Date }[] = [];

  if (isDbConfigured()) {
    try {
      dbPages = await prisma.page.findMany({
        select: { slug: true, title: true, updatedAt: true },
        orderBy: { slug: 'asc' },
      });
    } catch {
      /* ignore */
    }
  }

  const staticRoutes = Object.values(ROUTES);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Страницы сайта</h1>
      <p className="text-sm text-zinc-500">
        Сейчас контент в <code className="text-zinc-300">web/content/*.html</code>. После миграции в БД
        страницы можно редактировать здесь.
      </p>
      <table className="w-full text-sm border border-zinc-800 rounded-lg overflow-hidden">
        <thead className="bg-zinc-900 text-left">
          <tr>
            <th className="p-3">URL</th>
            <th className="p-3">Заголовок</th>
            <th className="p-3">В БД</th>
          </tr>
        </thead>
        <tbody>
          {staticRoutes.map((r) => {
            const inDb = dbPages.some((p) => p.slug === r.slug);
            return (
              <tr key={r.slug} className="border-t border-zinc-800">
                <td className="p-3 font-mono text-xs">
                  {r.slug === '' ? '/' : `/${r.slug}`}
                </td>
                <td className="p-3">{r.title}</td>
                <td className="p-3">{inDb ? 'да' : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
