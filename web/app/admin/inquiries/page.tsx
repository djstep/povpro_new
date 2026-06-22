import { isDbConfigured, prisma } from '@/lib/db';
import { InquiryAdminList } from '@/components/admin/InquiryAdminList';

export default async function AdminInquiriesPage() {
  if (!isDbConfigured()) {
    return (
      <p className="text-amber-400">
        Подключите DATABASE_URL в web/.env, затем <code className="text-zinc-300">npm run db:push</code>
      </p>
    );
  }

  let inquiries: Awaited<ReturnType<typeof prisma.inquiry.findMany>> = [];
  try {
    inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  } catch {
    return <p className="text-red-400">Не удалось подключиться к БД. Выполните миграцию схемы.</p>;
  }

  const serialized = inquiries.map((q) => ({
    ...q,
    createdAt: q.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Заявки</h1>
      <p className="text-sm text-zinc-500">{inquiries.length} записей (последние 200)</p>
      {inquiries.length === 0 ? (
        <p className="text-zinc-500">Заявок пока нет.</p>
      ) : (
        <InquiryAdminList initial={serialized} />
      )}
    </div>
  );
}
