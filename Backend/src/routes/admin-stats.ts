import { Router, Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { supabase }     from '../lib/supabase';

const router = Router();

// GET /api/admin/stats
router.get('/', requireAdmin, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [ordersRes, revenueRes, customersRes, productsRes, pendingRes, openTicketsRes, newInquiriesRes, recentOrdersRes] =
      await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total').not('status', 'in', '("cancelled","refunded")').gte('created_at', since30d),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'paid']),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('contact_inquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase
          .from('orders')
          .select('id, order_number, status, total, created_at, profiles(name, email)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

    const revenue30d = (revenueRes.data ?? []).reduce((sum, o) => sum + Number(o.total), 0);

    res.json({
      orders:         ordersRes.count       ?? 0,
      revenue30d,
      customers:      customersRes.count    ?? 0,
      activeProducts: productsRes.count     ?? 0,
      pendingOrders:  pendingRes.count      ?? 0,
      openTickets:    openTicketsRes.count  ?? 0,
      newInquiries:   newInquiriesRes.count ?? 0,
      recentOrders:   recentOrdersRes.data  ?? [],
    });
  } catch (err) {
    next(err);
  }
});

export default router;
