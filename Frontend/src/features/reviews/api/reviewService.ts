import { supabase } from '@/lib/supabase';
import type { Review, CreateReviewPayload } from '../types/review.types';

function mapReview(raw: Record<string, unknown>): Review {
  const profile = raw.profiles as { name?: string } | null;
  return {
    id:        String(raw.id ?? ''),
    userId:    String(raw.user_id ?? ''),
    userName:  profile?.name ?? 'Anonym',
    rating:    Number(raw.rating ?? 3) as Review['rating'],
    title:     String(raw.title ?? ''),
    body:      String(raw.body ?? ''),
    createdAt: String(raw.created_at ?? ''),
  };
}

export async function getReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapReview);
}

export async function createReview(productId: string, payload: CreateReviewPayload): Promise<Review> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw authErr ?? new Error('Nicht eingeloggt');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id: productId,
      user_id:    user.id,
      rating:     payload.rating,
      title:      payload.title,
      body:       payload.body,
    })
    .select('*, profiles(name)')
    .single();
  if (error) throw error;
  return mapReview(data as Record<string, unknown>);
}
