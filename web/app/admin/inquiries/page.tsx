import { isDbConfigured, prisma } from '@/lib/db';

export default async function AdminInquiriesPage() {
  if (!isDbConfigured()) {
    return (
      <p className="text-amber-400">
        Подключите DATABASE_URL в web/.env, затем <code>npx prisma migrate dev</code>
      </p>
    );
  }

  let inquiries: Awaited<ReturnType<typeof prisma.inquiry.findMany>> = [];
  try {
    inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  } catch {
    return <p className="text-red-400">Не удалось подключиться к БД. Проверьте миграции.</p>;
  }

  if (inquiries.length === 0) {
    return <p className="text-zinc-500">Заявок пока нет.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Заявки</h1>
      <ul className="space-y-3">
        {inquiries.map((q) => (
          <li key={q.id} className="border border-zinc-800 rounded-lg p-4">
            <div className="flex justify-between text-sm text-zinc-500">
              <span>{q.name}</span>
              <time>{q.createdAt.toLocaleString('ru-RU')}</time>
            </div>
            {q.phone && <p className="mt-1">{q.phone}</p>}
            {q.email && <p>{q.email}</p>}
            {q.message && <p className="mt-2 text-zinc-300">{q.message}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
