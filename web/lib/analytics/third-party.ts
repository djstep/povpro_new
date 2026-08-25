/** GA4 measurement ID (G-XXXXXXXX). */
export function getGaMeasurementId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return id || undefined;
}

/** Yandex Metrika counter ID (digits only). */
export function getYmCounterId(): number | undefined {
  const raw = process.env.NEXT_PUBLIC_YM_COUNTER_ID?.trim();
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  return Number(raw);
}

export function getYmFormGoal(): string {
  return process.env.NEXT_PUBLIC_YM_FORM_GOAL?.trim() || 'form_submit';
}

export function getGaFormEvent(): string {
  return process.env.NEXT_PUBLIC_GA_FORM_EVENT?.trim() || 'generate_lead';
}
