import { MediaAdminPanel } from '@/components/admin/MediaAdminPanel';

export default function AdminMediaPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Медиа</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Библиотека файлов — загрузка и удаление. Вкладка «На страницах» — подмена картинки или видео в
          уже существующем месте на сайте.
        </p>
      </div>
      <MediaAdminPanel />
    </div>
  );
}
