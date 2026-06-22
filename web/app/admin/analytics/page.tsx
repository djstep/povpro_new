import { isDbConfigured, prisma } from '@/lib/db';

export default async function AdminAnalyticsPage() {
  if (!isDbConfigured()) {
    return (
      <p className="text-amber-400">
        Подключите DATABASE_URL для сбора аналитики.
      </p>
    );
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let totals: { eventType: string; _count: number }[] = [];
  let topPages: { path: string | null; _count: number }[] = [];
  let topUtm: { utmSource: string | null; utmCampaign: string | null; _count: number }[] = [];
  let recent: Awaited<ReturnType<typeof prisma.analyticsEvent.findMany>> = [];

  try {
    const [allEvents, recentRows] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since } },
        select: {
          eventType: true,
          path: true,
          utmSource: true,
          utmCampaign: true,
        },
      }),
      prisma.analyticsEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
    ]);

    recent = recentRows;

    const countBy = (key: string, getKey: (e: (typeof allEvents)[0]) => string) => {
      const map = new Map<string, number>();
      for (const ev of allEvents) {
        const k = getKey(ev);
        map.set(k, (map.get(k) ?? 0) + 1);
      }
      return [...map.entries()]
        .map(([k, count]) => ({ key: k, count }))
        .sort((a, b) => b.count - a.count);
    };

    totals = countBy('eventType', (e) => e.eventType).map((r) => ({
      eventType: r.key,
      _count: r.count,
    }));

    const pageMap = new Map<string, number>();
    for (const ev of allEvents) {
      if (ev.eventType !== 'PAGE_VIEW') continue;
      const p = ev.path ?? '—';
      pageMap.set(p, (pageMap.get(p) ?? 0) + 1);
    }
    topPages = [...pageMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([path, count]) => ({ path: path === '—' ? null : path, _count: count }));

    topUtm = countBy('utm', (e) => `${e.utmSource ?? ''}|${e.utmCampaign ?? ''}`)
      .filter((r) => r.key !== '|')
      .slice(0, 15)
      .map((r) => {
        const [utmSource, utmCampaign] = r.key.split('|');
        return {
          utmSource: utmSource || null,
          utmCampaign: utmCampaign || null,
          _count: r.count,
        };
      });
  } catch {
    return (
      <p className="text-red-400">
        Таблица AnalyticsEvent не найдена. Выполните <code className="text-zinc-300">npm run db:push</code> в
        папке web.
      </p>
    );
  }

  const eventLabels: Record<string, string> = {
    PAGE_VIEW: 'Просмотры',
    CTA_CLICK: 'Клики по CTA',
    CLICK: 'Клики',
    FORM_SUBMIT: 'Отправки форм',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Аналитика</h1>
        <p className="text-sm text-zinc-500 mt-1">Последние 30 дней. UTM-метки сохраняются для рекламных кампаний.</p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Сводка по событиям</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {totals.map((row) => (
            <div key={row.eventType} className="rounded-lg border border-zinc-800 p-4">
              <p className="text-2xl font-bold">{row._count}</p>
              <p className="text-sm text-zinc-500">{eventLabels[row.eventType] ?? row.eventType}</p>
            </div>
          ))}
          {totals.length === 0 && <p className="text-zinc-600 text-sm">Данных пока нет — откройте сайт в другой вкладке.</p>}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Топ страниц</h2>
          <table className="w-full text-sm border border-zinc-800 rounded-lg overflow-hidden">
            <tbody>
              {topPages.map((row) => (
                <tr key={row.path ?? '—'} className="border-t border-zinc-800 first:border-0">
                  <td className="p-2 font-mono text-xs">{row.path ?? '—'}</td>
                  <td className="p-2 text-right text-zinc-400">{row._count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-3">UTM-кампании</h2>
          <table className="w-full text-sm border border-zinc-800 rounded-lg overflow-hidden">
            <tbody>
              {topUtm.map((row, i) => (
                <tr key={i} className="border-t border-zinc-800 first:border-0">
                  <td className="p-2 text-xs">
                    {[row.utmSource, row.utmCampaign].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="p-2 text-right text-zinc-400">{row._count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Последние события</h2>
        <ul className="space-y-2 text-xs font-mono">
          {recent.map((ev) => (
            <li key={ev.id} className="border border-zinc-900 rounded px-3 py-2 text-zinc-400">
              {ev.createdAt.toLocaleString('ru-RU')} · {ev.eventType} · {ev.path}
              {ev.utmSource ? ` · utm=${ev.utmSource}` : ''}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
