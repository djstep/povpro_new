import nodemailer from 'nodemailer';

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

/** Убирает CR/LF и управляющие символы — защита от инъекции почтовых заголовков. */
function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ').trim();
}

function parseRecipients(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Как на старом сайте: sendmail/postfix без паролей. Либо SMTP с логином. */
function getMailTransportMode(): 'sendmail' | 'smtp' | 'none' {
  const explicit = process.env.MAIL_TRANSPORT?.trim().toLowerCase();
  if (explicit === 'sendmail') return 'sendmail';
  if (explicit === 'smtp') return 'smtp';
  if (explicit === 'none') return 'none';
  if (process.env.MAIL_USE_SENDMAIL === 'true') return 'sendmail';
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  return 'none';
}

export function isMailConfigured(): boolean {
  return getMailTransportMode() !== 'none';
}

function createTransport() {
  const mode = getMailTransportMode();

  if (mode === 'sendmail') {
    // Аналог PHP mail() на Beget: локальный MTA (postfix/sendmail)
    return nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: process.env.SENDMAIL_PATH || '/usr/sbin/sendmail',
    });
  }

  if (mode === 'smtp') {
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

  throw new Error('Почта не настроена: MAIL_TRANSPORT=sendmail или SMTP_*');
}

function resolveRecipients(): string[] {
  const fromEnv = parseRecipients(process.env.MAIL_TO);
  if (fromEnv.length > 0) return fromEnv;
  // Как в старом model.php: admin@ + logistica@
  return ['admin@povpro.ru', 'logistica@povpro.ru'];
}

export async function sendInquiryMail(payload: InquiryMailPayload): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error('Почта не настроена');
  }

  const to = resolveRecipients();
  const from = process.env.MAIL_FROM || 'noreply@povpro.ru';

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

  const safeName = sanitizeHeaderValue(payload.name);
  const safeCompany = payload.company ? sanitizeHeaderValue(payload.company) : '';
  const safeReplyTo = payload.email ? sanitizeHeaderValue(payload.email) : '';

  const transport = createTransport();
  await transport.sendMail({
    from: `"PovPro.ru" <${from}>`,
    to,
    replyTo: safeReplyTo || undefined,
    subject: `Новый заказ с сайта: ${safeName}${safeCompany ? ` (${safeCompany})` : ''}`,
    text: lines.join('\n'),
    attachments: (payload.attachments ?? []).map((file) => ({
      filename: sanitizeHeaderValue(file.filename) || 'attachment',
      content: file.content,
      contentType: file.contentType,
    })),
  });
}
