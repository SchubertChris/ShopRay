import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { supabase }     from '../lib/supabase';

const router = Router();
router.use(requireAdmin);

const QuerySchema = z.object({
  period: z.enum(['7', '30', '90']).optional().default('30'),
});

// GET /api/admin/analytics?period=7|30|90
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period } = QuerySchema.parse(req.query);
    const days       = parseInt(period);
    const sinceDate  = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [ordersRes, itemsRes, allTimeRes] = await Promise.all([
      // Alle Bestellungen im Zeitraum (inkl. Datum und Status)
      supabase
        .from('orders')
        .select('id, created_at, total, status, discount_amount')
        .gte('created_at', sinceDate)
        .order('created_at', { ascending: true }),

      // Bestellpositionen im Zeitraum für Top-Produkte
      supabase
        .from('order_items')
        .select('product_name, quantity, price, order_id, orders!inner(created_at, status)')
        .gte('orders.created_at', sinceDate)
        .not('orders.status', 'in', '("cancelled","refunded","payment_failed")'),

      // Alle Bestellungen ever für Gesamtumsatz
      supabase
        .from('orders')
        .select('total, status')
        .not('status', 'in', '("cancelled","refunded","payment_failed")'),
    ]);

    const orders = ordersRes.data ?? [];
    const items  = itemsRes.data ?? [];

    // ── Tages-Aggregation (Umsatz + Bestellungen) ─────────────────────────────
    const dayMap = new Map<string, { revenue: number; orders: number }>();

    // Alle Tage im Zeitraum vorinitialisieren
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { revenue: 0, orders: 0 });
    }

    for (const order of orders) {
      const key = (order.created_at as string).slice(0, 10);
      if (!dayMap.has(key)) continue;
      const entry = dayMap.get(key)!;
      entry.orders += 1;
      if (!['cancelled', 'refunded', 'payment_failed'].includes(order.status as string)) {
        entry.revenue += Number(order.total);
      }
    }

    const revenueByDay = Array.from(dayMap.entries()).map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue * 100) / 100,
      orders:  v.orders,
    }));

    // ── Status-Verteilung ─────────────────────────────────────────────────────
    const statusMap = new Map<string, number>();
    for (const order of orders) {
      const s = order.status as string;
      statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
    }

    const statusBreakdown = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // ── Top-Produkte ──────────────────────────────────────────────────────────
    const productMap = new Map<string, { revenue: number; quantity: number }>();
    for (const item of items) {
      const name = item.product_name as string;
      const entry = productMap.get(name) ?? { revenue: 0, quantity: 0 };
      entry.revenue  += Number(item.price) * Number(item.quantity);
      entry.quantity += Number(item.quantity);
      productMap.set(name, entry);
    }

    const topProducts = Array.from(productMap.entries())
      .map(([name, v]) => ({
        name,
        revenue:  Math.round(v.revenue * 100) / 100,
        quantity: v.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const paidOrders = orders.filter(o => !['cancelled', 'refunded', 'payment_failed'].includes(o.status as string));
    const periodRevenue   = paidOrders.reduce((s, o) => s + Number(o.total), 0);
    const discountTotal   = orders.reduce((s, o) => s + Number(o.discount_amount ?? 0), 0);
    const avgOrderValue   = paidOrders.length > 0 ? periodRevenue / paidOrders.length : 0;
    const allTimeRevenue  = (allTimeRes.data ?? []).reduce((s, o) => s + Number(o.total), 0);

    res.json({
      period:        days,
      revenueByDay,
      statusBreakdown,
      topProducts,
      kpi: {
        periodRevenue:   Math.round(periodRevenue   * 100) / 100,
        allTimeRevenue:  Math.round(allTimeRevenue  * 100) / 100,
        avgOrderValue:   Math.round(avgOrderValue   * 100) / 100,
        totalOrders:     orders.length,
        paidOrders:      paidOrders.length,
        discountTotal:   Math.round(discountTotal   * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
