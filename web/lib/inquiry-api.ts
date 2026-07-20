export type InquiryPayload = {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  message?: string;
  source?: string;
  files?: File[];
};

export type InquiryResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export function parseContact(value: string): Pick<InquiryPayload, 'phone' | 'email'> {
  const trimmed = value.trim();
  if (!trimmed) return {};
  if (trimmed.includes('@')) return { email: trimmed };
  return { phone: trimmed };
}

export async function submitInquiry(payload: InquiryPayload): Promise<InquiryResult> {
  try {
    const form = new FormData();
    form.set('name', payload.name);
    if (payload.phone) form.set('phone', payload.phone);
    if (payload.email) form.set('email', payload.email);
    if (payload.company) form.set('company', payload.company);
    if (payload.message) form.set('message', payload.message);
    if (payload.source) form.set('source', payload.source);
    for (const file of payload.files ?? []) {
      form.append('files', file, file.name);
    }

    const res = await fetch('/api/inquiry', {
      method: 'POST',
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = typeof data.error === 'string' ? data.error : 'Не удалось отправить заявку';
      return { ok: false, error: err };
    }
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, error: 'Ошибка сети. Попробуйте позже.' };
  }
}
