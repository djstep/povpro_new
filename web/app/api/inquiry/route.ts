import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, isDbConfigured } from '@/lib/db';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { isMailConfigured, sendInquiryMail, type MailAttachment } from '@/lib/mail';

export const runtime = 'nodejs';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_EXT = new Set(['.pdf', '.dwg', '.docx', '.zip']);

const fieldsSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional().or(z.literal('')),
  company: z.string().max(300).optional(),
  message: z.string().max(5000).optional(),
  source: z.string().max(100).optional(),
});

function getExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

async function parseBody(request: Request): Promise<{
  fields: z.infer<typeof fieldsSchema>;
  attachments: MailAttachment[];
}> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const fields = fieldsSchema.parse({
      name: String(form.get('name') ?? ''),
      phone: String(form.get('phone') ?? '') || undefined,
      email: String(form.get('email') ?? ''),
      company: String(form.get('company') ?? '') || undefined,
      message: String(form.get('message') ?? '') || undefined,
      source: String(form.get('source') ?? '') || undefined,
    });

    const attachments: MailAttachment[] = [];
    const files = form.getAll('files').filter((v): v is File => typeof File !== 'undefined' && v instanceof File);

    if (files.length > MAX_FILES) {
      throw new Error(`Можно прикрепить не более ${MAX_FILES} файлов`);
    }

    for (const file of files) {
      if (!file.name || file.size <= 0) continue;
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(`Файл «${file.name}» превышает 20 МБ`);
      }
      const ext = getExt(file.name);
      if (!ALLOWED_EXT.has(ext)) {
        throw new Error(`Формат файла «${file.name}» не поддерживается`);
      }
      const buf = Buffer.from(await file.arrayBuffer());
      attachments.push({
        filename: file.name,
        content: buf,
        contentType: file.type || undefined,
      });
    }

    return { fields, attachments };
  }

  const json = await request.json();
  const fields = fieldsSchema.parse(json);
  return { fields, attachments: [] };
}

export async function POST(request: Request) {
  const limit = rateLimit(`inquiry:${getClientIp(request)}`, 5, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Слишком много заявок подряд. Подождите минуту.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let fields: z.infer<typeof fieldsSchema>;
  let attachments: MailAttachment[];

  try {
    ({ fields, attachments } = await parseBody(request));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Неверные данные формы';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const data = fields;
  const messageParts = [
    data.company ? `Компания: ${data.company}` : null,
    data.message || null,
    attachments.length
      ? `Прикреплённые файлы: ${attachments.map((f) => f.filename).join(', ')}`
      : null,
  ].filter(Boolean);

  const savedMessage = messageParts.length > 0 ? messageParts.join('\n\n') : null;

  let inquiryId: string | undefined;

  if (isDbConfigured()) {
    try {
      const inquiry = await prisma.inquiry.create({
        data: {
          name: data.name,
          phone: data.phone || null,
          email: data.email || null,
          message: savedMessage,
          source: data.source || 'site',
        },
      });
      inquiryId = inquiry.id;
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'Ошибка сохранения заявки' }, { status: 500 });
    }
  } else {
    console.info('[inquiry]', { ...data, files: attachments.map((f) => f.filename) });
  }

  if (isMailConfigured()) {
    try {
      await sendInquiryMail({
        name: data.name,
        phone: data.phone,
        email: data.email,
        company: data.company,
        message: data.message,
        source: data.source || 'site',
        attachments,
      });
    } catch (e) {
      console.error('[inquiry mail]', e);
      return NextResponse.json(
        {
          error: 'Заявка сохранена, но не удалось отправить письмо. Проверьте почту на сервере.',
          id: inquiryId,
        },
        { status: 502 },
      );
    }
  } else {
    console.warn('[inquiry] Почта не настроена — письмо не отправлено');
  }

  return NextResponse.json({
    ok: true,
    id: inquiryId,
    mailed: isMailConfigured(),
    message: isMailConfigured()
      ? undefined
      : 'Заявка принята (почта не настроена — письмо не отправлено)',
  });
}
