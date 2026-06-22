import { PageStructureAdmin } from '@/components/admin/PageStructureAdmin';

export default function AdminPagesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Страницы и структура сайта</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Создавайте страницы, группируйте их по категориям в меню и редактируйте контент (текст, фото, видео).
        </p>
      </div>
      <PageStructureAdmin />
    </div>
  );
}
