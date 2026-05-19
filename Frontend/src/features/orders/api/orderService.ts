import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, ReturnRequest } from '@/types/order';

function mapItem(raw: Record<string, unknown>): OrderItem {
  return {
    id:          String(raw.id ?? ''),
    productId:   String(raw.product_id ?? ''),
    productName: String(raw.product_name ?? ''),
    price:       String(raw.price ?? '0'),
    quantity:    Number(raw.quantity ?? 1),
    imageUrl:    (raw.image_url as string | null) ?? null,
  };
}

function mapReturnRequest(raw: Record<string, unknown>): ReturnRequest {
  return {
    id:        String(raw.id ?? ''),
    status:    (raw.status as ReturnRequest['status']) ?? 'requested',
    label_url: (raw.label_url as string | null) ?? null,
    createdAt: String(raw.created_at ?? ''),
  };
}

function mapOrder(raw: Record<string, unknown>): Order {
  const rawItems = Array.isArray(raw.order_items)
    ? (raw.order_items as Record<string, unknown>[])
    : [];
  const rawReturn = raw.return_request as Record<string, unknown> | null;
  return {
    id:              String(raw.id ?? ''),
    orderNumber:     String(raw.order_number ?? ''),
    status:          (raw.status as Order['status']) ?? 'pending',
    items:           rawItems.map(mapItem),
    shippingAddress: (raw.shipping_address as Order['shippingAddress']) ?? null,
    total:           Number(raw.total ?? 0),
    paymentMethod:   (raw.payment_method as string | null) ?? null,
    paidAt:          (raw.paid_at as string | null) ?? null,
    shippedAt:       (raw.shipped_at as string | null) ?? null,
    trackingNumber:  (raw.tracking_number as string | null) ?? null,
    customerNote:    (raw.customer_note as string | null) ?? null,
    stripeSessionId: (raw.stripe_session_id as string | null) ?? null,
    returnRequest:   rawReturn ? mapReturnRequest(rawReturn) : null,
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

export async function cancelOrder(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Nicht eingeloggt');

  const res = await fetch(`/api/orders/${id}/cancel`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Stornierung fehlgeschlagen.');
  }
}

export async function requestReturn(id: string, reason: string): Promise<ReturnRequest> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Nicht eingeloggt');

  const res = await fetch(`/api/orders/${id}/return`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Rücksendung konnte nicht beantragt werden.');
  }
  const { returnRequest } = await res.json() as { returnRequest: Record<string, unknown> };
  return mapReturnRequest(returnRequest);
}
