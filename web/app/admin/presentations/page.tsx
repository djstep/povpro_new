import { PresentationsAdmin } from '@/components/admin/PresentationsAdmin';

export default function AdminPresentationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Презентации</h1>
        <p className="text-sm text-zinc-500 mt-1">
          PDF-файлы, на которые ведут кнопки сайта: замена файла, загрузка новых и добавление кнопок на страницы.
        </p>
      </div>
      <PresentationsAdmin />
    </div>
  );
}
