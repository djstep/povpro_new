import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const segments = (await params).path;
  const rel = segments.join('/');

  if (!rel || rel.includes('..')) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'public', 'assets', rel);
  const resolved = path.resolve(filePath);
  const assetsRoot = path.resolve(process.cwd(), 'public', 'assets');

  if (!resolved.startsWith(assetsRoot + path.sep) && resolved !== assetsRoot) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const ext = path.extname(resolved).toLowerCase();
  const body = fs.readFileSync(resolved);

  return new NextResponse(body, {
    headers: {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
