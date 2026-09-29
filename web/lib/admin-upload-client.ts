'use client';

export type UploadedKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export type UploadResult = {
  path: string;
  kind: UploadedKind;
  filename: string;
};

const COMPRESSIBLE = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const MAX_SIDE = 2560;
const WEBP_QUALITY = 0.85;
/** WebP-файлы меньше этого размера не пережимаем */
const SKIP_WEBP_BELOW = 400 * 1024;

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fallback ниже */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Сжимает PNG/JPEG в WebP и уменьшает до MAX_SIDE по большей стороне. Если выигрыша нет — вернёт исходный файл. */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!COMPRESSIBLE.has(file.type)) return file;
  if (file.type === 'image/webp' && file.size < SKIP_WEBP_BELOW) return file;

  try {
    const source = await loadBitmap(file);
    const srcW = 'naturalWidth' in source ? source.naturalWidth : source.width;
    const srcH = 'naturalHeight' in source ? source.naturalHeight : source.height;
    if (!srcW || !srcH) return file;

    const scale = Math.min(1, MAX_SIDE / Math.max(srcW, srcH));
    const w = Math.round(srcW * scale);
    const h = Math.round(srcH * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(source, 0, 0, w, h);
    if ('close' in source) source.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    );
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } catch {
    return file;
  }
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function describeHttpError(status: number, size: number): string {
  if (status === 413) {
    return `Файл (${formatMb(size)}) слишком большой для сервера. Нужно увеличить лимит загрузки в nginx (client_max_body_size) или уменьшить файл.`;
  }
  if (status === 401 || status === 403) return 'Сессия админки истекла — войдите заново.';
  if (status === 502 || status === 503 || status === 504) {
    return 'Сервер не ответил вовремя. Попробуйте ещё раз или загрузите файл меньшего размера.';
  }
  return `Ошибка сервера (${status}). Попробуйте ещё раз.`;
}

/**
 * Загружает файл в библиотеку (/api/admin/upload).
 * Картинки перед отправкой сжимаются в WebP. Ошибки сервера переводятся в понятный текст.
 */
export async function uploadAdminFile(original: File): Promise<UploadResult> {
  const file = await compressImageForUpload(original);
  const form = new FormData();
  form.append('file', file);

  let res: Response;
  try {
    res = await fetch('/api/admin/upload', { method: 'POST', body: form });
  } catch {
    throw new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.');
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  if (!isJson) throw new Error(describeHttpError(res.status, file.size));

  const data = (await res.json()) as { path?: string; kind?: UploadedKind; error?: string };
  if (!res.ok || !data.path) {
    throw new Error(data.error ?? describeHttpError(res.status, file.size));
  }

  return {
    path: data.path,
    kind: data.kind ?? 'IMAGE',
    filename: data.path.split('/').pop() ?? data.path,
  };
}

/** Безопасно читает JSON-ответ админского API (nginx может вернуть HTML-страницу ошибки). */
export async function readAdminJson<T extends { error?: unknown }>(res: Response): Promise<T> {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  if (!isJson) {
    return { error: describeHttpError(res.status, 0) } as T;
  }
  return (await res.json()) as T;
}
