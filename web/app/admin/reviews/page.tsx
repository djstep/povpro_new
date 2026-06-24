import { isDbConfigured, prisma } from '@/lib/db';
import { ReviewAdminList } from '@/components/admin/ReviewAdminList';

export default async function AdminReviewsPage() {
  if (!isDbConfigured()) {
    return (
      <p className="text-amber-400">
        Подключите DATABASE_URL в web/.env, затем <code className="text-zinc-300">npm run db:push</code>
      </p>
    );
  }

  let reviews: Awaited<ReturnType<typeof prisma.review.findMany>> = [];
  try {
    reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  } catch {
    return <p className="text-red-400">Не удалось подключиться к БД. Выполните миграцию схемы.</p>;
  }

  const serialized = reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Отзывы</h1>
      <p className="text-sm text-zinc-500">
        {reviews.length} записей (последние 200). Новые отзывы приходят на модерацию и публикуются вручную.
      </p>
      {reviews.length === 0 ? (
        <p className="text-zinc-500">Отзывов пока нет.</p>
      ) : (
        <ReviewAdminList initial={serialized} />
      )}
    </div>
  );
}
