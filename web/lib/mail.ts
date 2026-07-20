import nodemailer from 'nodemailer';
import { SITE_CONTACTS } from '@/lib/site-contacts';

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type InquiryMailPayload = {
  name: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  message?: string | null;
  source?: string | null;
  attachments?: MailAttachment[];
};

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function isMailConfigured(): boolean {
  return smtpConfigured();
}

function createTransport() {
  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
}

export async function sendInquiryMail(payload: InquiryMailPayload): Promise<void> {
  if (!smtpConfigured()) {
    throw new Error('SMTP не настроен: задайте SMTP_HOST, SMTP_USER, SMTP_PASS в .env');
  }

  const to = process.env.MAIL_TO || SITE_CONTACTS.email;
  const from = process.env.MAIL_FROM || process.env.SMTP_USER!;

  const lines = [
    'Новая заявка с сайта «ППО №3»',
    '',
    `Имя: ${payload.name}`,
    payload.company ? `Компания: ${payload.company}` : null,
    payload.phone ? `Телефон: ${payload.phone}` : null,
    payload.email ? `Email: ${payload.email}` : null,
    payload.source ? `Источник: ${payload.source}` : null,
    '',
    'Сообщение:',
    payload.message?.trim() || '—',
  ].filter((line): line is string => line !== null);

  const transport = createTransport();
  await transport.sendMail({
    from: `"«ППО №3» — сайт" <${from}>`,
    to,
    replyTo: payload.email || undefined,
    subject: `Заявка с сайта: ${payload.name}${payload.company ? ` (${payload.company})` : ''}`,
    text: lines.join('\n'),
    attachments: (payload.attachments ?? []).map((file) => ({
      filename: file.filename,
      content: file.content,
      contentType: file.contentType,
    })),
  });
}
