import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, getAdminAuthMode } from '@/lib/admin-auth-constants';
import { verifyAdminSessionToken } from '@/lib/admin-auth-crypto';

const PUBLIC_ADMIN_PATHS = ['/admin/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (pathname === '/api/admin/login' || pathname === '/api/admin/logout') {
    return NextResponse.next();
  }

  const mode = getAdminAuthMode();

  if (mode === 'open') {
    return NextResponse.next();
  }

  if (mode === 'locked') {
    if (isAdminApi) {
      return NextResponse.json(
        { error: 'Админка отключена: на сервере не задан ADMIN_PASSWORD' },
        { status: 503 },
      );
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('locked', '1');
    return NextResponse.redirect(loginUrl);
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!(await verifyAdminSessionToken(token))) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // /api/admin/upload исключён: с Node-middleware Next 15.5 multipart-тело больше ~0.5 МБ
  // приходит в роут «disturbed or locked» (500). Авторизацию роут проверяет сам (requireAdminApi).
  matcher: ['/admin/:path*', '/api/admin/((?!upload(?:/|$)).*)'],
  // Node runtime: доступ к ADMIN_PASSWORD / ADMIN_SESSION_SECRET из .env на VPS
  runtime: 'nodejs',
};
