import { MediaAdminPanel } from '@/components/admin/MediaAdminPanel';

export default function AdminMediaPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Медиа сайта</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Замена любого изображения или видео по исходному URL. Изменения сохраняются в базе и применяются на
          всех страницах, где используется этот файл.
        </p>
      </div>
      <MediaAdminPanel />
    </div>
  );
}
