import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// `next start` отдаёт из public/ только файлы, существовавшие при запуске сервера.
// Файлы, загруженные через админку позже, отдаём отсюда.

export const dynamic = 'force-dynamic';

const CONTENT_TYPES: Record<string, string> = {
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

function toWebStream(stream: fs.ReadStream): ReadableStream {
  return Readable.toWeb(stream) as ReadableStream;
}

export async function GET(request: Request, { params }: { params: Promise<{ file: string[] }> }) {
  const { file } = await params;
  const filename = file.length === 1 ? file[0] : '';
  if (!filename || filename.startsWith('.') || filename.includes('..') || /[\\/]/.test(filename)) {
    return new Response('Not found', { status: 404 });
  }

  const contentType = CONTENT_TYPES[path.extname(filename).toLowerCase()];
  if (!contentType) return new Response('Not found', { status: 404 });

  const fullPath = path.join(process.cwd(), 'public', 'assets', 'uploads', filename);
  let size: number;
  try {
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) return new Response('Not found', { status: 404 });
    size = stat.size;
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const baseHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=2592000, stale-while-revalidate=86400',
    'X-Content-Type-Options': 'nosniff',
  };

  const range = request.headers.get('range');
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (match && (match[1] || match[2])) {
    let start = match[1] ? Number(match[1]) : size - Number(match[2]);
    let end = match[1] && match[2] ? Number(match[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    return new Response(toWebStream(fs.createReadStream(fullPath, { start, end })), {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': String(end - start + 1),
      },
    });
  }

  return new Response(toWebStream(fs.createReadStream(fullPath)), {
    headers: { ...baseHeaders, 'Content-Length': String(size) },
  });
}
