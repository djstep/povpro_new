export type InquiryPayload = {
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  source?: string;
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
    const res = await fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error ? 'Проверьте данные формы' : 'Не удалось отправить заявку' };
    }
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, error: 'Ошибка сети. Попробуйте позже.' };
  }
}
