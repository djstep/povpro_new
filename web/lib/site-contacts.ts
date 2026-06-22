/** Контакты и соцсети — единая точка для шапки, футера и т.д. */
export const SITE_CONTACTS = {
  phone: '+78482555900',
  phoneDisplay: '8 (8482) 555-900',
  email: 'office@povpro.ru',
  address: 'г. Тольятти, ул. Окраинная, 24',
  telegram: 'https://t.me/+78482555900',
  /** Профиль или канал в MAX — задайте NEXT_PUBLIC_MAX_MESSENGER_URL при деплое */
  maxMessenger:
    process.env.NEXT_PUBLIC_MAX_MESSENGER_URL ?? 'https://max.ru',
} as const;
