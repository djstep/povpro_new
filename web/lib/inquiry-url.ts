export type InquiryUrlParams = {
  from?: string;
  subject?: string;
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  contact?: string;
  message?: string;
};

export function inquiryPageUrl(params: InquiryUrlParams = {}): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value?.trim()) q.set(key, value.trim());
  }
  const query = q.toString();
  return query ? `/zakaz?${query}` : '/zakaz';
}
