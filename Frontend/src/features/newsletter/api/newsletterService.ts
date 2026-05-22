import api from '@/api/axiosinstance';

export interface SubscribePayload { email: string }
export interface SubscribeResponse { success: boolean }

/** POST /newsletter/subscribe — E-Mail in Brevo-Liste eintragen (Double-Opt-In) */
export async function subscribeNewsletter(payload: SubscribePayload): Promise<SubscribeResponse> {
  const { data } = await api.post<SubscribeResponse>('/newsletter/subscribe', payload);
  return data;
}
