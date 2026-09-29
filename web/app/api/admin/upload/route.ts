import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api-guard';

const MAX_BYTES = 50 * 1024 * 1024;
// SVG намеренно НЕ разрешён: SVG может содержать встроенный JavaScript и при
// открытии файла напрямую с того же домена приводит к XSS.
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogg',
  'application/pdf': '.pdf',
};

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.pdf': 'application/pdf',
};

function detectMime(file: File): string {
  const declared = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  if (declared && EXT_BY_MIME[declared]) return declared;
  return MIME_BY_EXT[path.extname(file.name).toLowerCase()] ?? declared ?? 'application/octet-stream';
}

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Не удалось прочитать файл. Возможно, он слишком большой или загрузка прервалась.' },
      { status: 400 },
    );
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Файл не передан' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Файл больше 50 МБ' }, { status: 400 });
  }

  const mime = detectMime(file);
  const ext = EXT_BY_MIME[mime];
  if (!ext) {
    return NextResponse.json(
      { error: `Тип файла не поддерживается: ${mime || file.name}. Можно: JPG, PNG, WebP, GIF, MP4, WebM, PDF.` },
      { status: 400 },
    );
  }

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
  const kind = mime.startsWith('video/') ? 'VIDEO' : mime === 'application/pdf' ? 'DOCUMENT' : 'IMAGE';

  return NextResponse.json({ ok: true, path: publicPath, kind });
}
