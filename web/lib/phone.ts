/** Маска российского телефона: +7 (___) ___-__-__ */

export function digitsFromPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (digits.length > 0 && !digits.startsWith('7')) digits = `7${digits}`;
  return digits.slice(0, 11);
}

export function formatRuPhoneInput(raw: string): string {
  const digits = digitsFromPhone(raw);
  if (!digits) return '';

  let out = '+7';
  if (digits.length === 1) return out;

  out += ` (${digits.slice(1, 4)}`;
  if (digits.length >= 4) out += ')';
  if (digits.length > 4) out += ` ${digits.slice(4, 7)}`;
  if (digits.length > 7) out += `-${digits.slice(7, 9)}`;
  if (digits.length > 9) out += `-${digits.slice(9, 11)}`;
  return out;
}

/** Полный номер: 11 цифр, начинается с 7 */
export function isCompleteRuPhone(value: string): boolean {
  const digits = digitsFromPhone(value);
  return digits.length === 11 && digits.startsWith('7');
}
