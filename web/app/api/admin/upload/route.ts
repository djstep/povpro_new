import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api-guard';

const MAX_BYTES = 25 * 1024 * 1024;
// SVG намеренно НЕ разрешён: SVG может содержать встроенный JavaScript и при
// открытии файла напрямую с того же домена приводит к XSS.
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/ogg',
]);

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Ожидается multipart/form-data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Файл не передан' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Файл больше 25 МБ' }, { status: 400 });
  }

  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ error: `Тип файла не поддерживается: ${mime}` }, { status: 400 });
  }

  const ext =
    {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/ogg': '.ogg',
    }[mime] ?? (path.extname(file.name) || '.bin');

  const uploadsDir = path.join(process.cwd(), 'public', 'assets', 'uploads');
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error:
          'Не удалось создать папку uploads. На Vercel используйте внешний URL или подключите Blob-хранилище.',
      },
      { status: 503 },
    );
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
  const dest = path.join(uploadsDir, filename);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(dest, buffer);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error:
          'Запись файла недоступна (read-only FS). Укажите URL файла вручную или настройте хранилище.',
      },
      { status: 503 },
    );
  }

  const publicPath = `/assets/uploads/${filename}`;
  const kind = mime.startsWith('video/') ? 'VIDEO' : 'IMAGE';

  return NextResponse.json({ ok: true, path: publicPath, kind });
}
