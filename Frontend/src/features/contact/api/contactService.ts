import api from '@/api/axiosinstance';
import type { ContactFormPayload, ContactFormResponse } from '@/types/contact';

/** POST /contact — Kontaktformular absenden */
export async function submitContact(payload: ContactFormPayload): Promise<ContactFormResponse> {
  const { data } = await api.post<ContactFormResponse>('/contact', payload);
  return data;
}
