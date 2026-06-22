import { Suspense } from 'react';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { isAdminPasswordConfigured } from '@/lib/admin-auth';

export default function AdminLoginPage() {
  const required = isAdminPasswordConfigured();

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-bold">Вход в админку</h1>
      {!required ? (
        <p className="text-amber-400 text-sm">
          Пароль не настроен. Задайте <code className="text-zinc-300">ADMIN_PASSWORD</code> в{' '}
          <code className="text-zinc-300">web/.env</code> для защиты панели.
        </p>
      ) : (
        <Suspense fallback={<p className="text-zinc-500">Загрузка…</p>}>
          <AdminLoginForm />
        </Suspense>
      )}
    </div>
  );
}
