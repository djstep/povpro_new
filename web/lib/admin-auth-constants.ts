export const ADMIN_COOKIE = 'ppo_admin_session';
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'dev-insecure-secret';
}

export function isAdminPasswordConfigured(): boolean {
  const pwd = process.env.ADMIN_PASSWORD?.trim();
  return Boolean(pwd && pwd.length >= 4);
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Режим доступа к админке:
 *  - 'password' — задан ADMIN_PASSWORD, требуется вход;
 *  - 'open'     — пароль не задан, но это dev-окружение → доступ без входа (для локальной разработки);
 *  - 'locked'   — пароль не задан в production → админка ЗАКРЫТА (fail-closed), чтобы случайно
 *                 не оставить панель открытой при незаданной переменной окружения.
 */
export type AdminAuthMode = 'password' | 'open' | 'locked';

export function getAdminAuthMode(): AdminAuthMode {
  if (isAdminPasswordConfigured()) return 'password';
  return isProduction() ? 'locked' : 'open';
}
