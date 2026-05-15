import { supabase } from '@/lib/supabase';
import type { Order, OrderItem } from '@/types/order';

function mapItem(raw: Record<string, unknown>): OrderItem {
  return {
    id:          String(raw.id ?? ''),
    productId:   String(raw.product_id ?? ''),
    productName: String(raw.product_name ?? ''),
    price:       String(raw.price ?? '0'),
    quantity:    Number(raw.quantity ?? 1),
  };
}

function mapOrder(raw: Record<string, unknown>): Order {
  const rawItems = Array.isArray(raw.order_items)
    ? (raw.order_items as Record<string, unknown>[])
    : [];
  return {
    id:              String(raw.id ?? ''),
    orderNumber:     String(raw.order_number ?? ''),
    status:          (raw.status as Order['status']) ?? 'pending',
    items:           rawItems.map(mapItem),
    shippingAddress: (raw.shipping_address as Order['shippingAddress']) ?? null,
    total:           Number(raw.total ?? 0),
    paidAt:          (raw.paid_at as string | null) ?? null,
    shippedAt:       (raw.shipped_at as string | null) ?? null,
    customerNote:    (raw.customer_note as string | null) ?? null,
    stripeSessionId: (raw.stripe_session_id as string | null) ?? null,
    createdAt:       String(raw.created_at ?? ''),
    updatedAt:       String(raw.updated_at ?? ''),
  };
}

export async function getOrders(): Promise<Order[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapOrder);
}

export async function getOrderById(id: string): Promise<Order> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht eingeloggt');

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (error) throw error;
  return mapOrder(data as Record<string, unknown>);
}
