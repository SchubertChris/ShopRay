import { supabase } from './supabase';

export async function createNotification(
  type: string,
  title: string,
  body?: string,
  link?: string,
): Promise<void> {
  const { error } = await supabase
    .from('admin_notifications')
    .insert({ type, title, body: body ?? null, link: link ?? null });
  if (error) console.error('[notify] insert failed:', error.message);
}
