import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { RefreshCw, Loader2, AlertCircle, TrendingUp, ShoppingCart, Package, Tag } from 'lucide-react';
import { getAnalytics, type AnalyticsData } from '../../api/adminApi';

type Period = 7 | 30 | 90;

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: 7,  label: '7 Tage'  },
  { value: 30, label: '30 Tage' },
  { value: 90, label: '90 Tage' },
];

const STATUS_LABELS: Record<string, string> = {
  pending:        'Ausstehend',
  paid:           'Bezahlt',
  shipped:        'Versendet',
  delivered:      'Zugestellt',
  cancelled:      'Storniert',
  payment_failed: 'Zahlung fehlg.',
  refunded:       'Erstattet',
};

const STATUS_COLORS: Record<string, string> = {
  paid:           '#10b981',
  delivered:      '#6366f1',
  shipped:        '#3b82f6',
  pending:        '#f59e0b',
  cancelled:      '#ef4444',
  payment_failed: '#dc2626',
  refunded:       '#8b5cf6',
};

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);
}

function fmtShort(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K €`;
  return `${n.toFixed(0)} €`;
}

function fmtDate(iso: string, period: Period) {
  const d = new Date(iso);
  if (period === 7) return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' });
  if (period <= 30) return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

interface KpiCardProps {
  label:   string;
  value:   string;
  sub?:    string;
  icon:    React.ComponentType<{ size?: number; strokeWidth?: number }>;
  accent?: string;
}

function KpiCard({ label, value, sub, icon: Icon, accent }: KpiCardProps) {
  return (
    <div className="an-kpi">
      <div className="an-kpi__icon" style={{ color: accent }}>
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <p className="an-kpi__label">{label}</p>
      <p className="an-kpi__value">{value}</p>
      {sub && <p className="an-kpi__sub">{sub}</p>}
    </div>
  );
}

// Eigener Tooltip für Recharts
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <p className="an-tooltip__date">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="an-tooltip__row">
          <span>{p.name === 'revenue' ? 'Umsatz' : 'Bestellungen'}</span>
          <strong>{p.name === 'revenue' ? fmt(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period,  setPeriod]  = useState<Period>(30);
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAnalytics(period));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const chartData = data?.revenueByDay.map(d => ({
    ...d,
    dateLabel: fmtDate(d.date, period),
  })) ?? [];

  const pieData = data?.statusBreakdown.map(s => ({
    name:  STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? '#94a3b8',
  })) ?? [];

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Übersicht</span>
          <h1 className="page-header__title">Analytics</h1>
          <p className="page-header__sub">
            {data ? `${fmt(data.kpi.periodRevenue)} Umsatz in den letzten ${period} Tagen` : 'Umsatz- und Bestellungsauswertung'}
          </p>
        </div>
        <div className="page-header__actions">
          <div className="an-period-nav">
            {PERIODS.map(p => (
              <button
                key={p.value}
                className={`an-period-btn${period === p.value ? ' is-active' : ''}`}
                onClick={() => setPeriod(p.value)}
                disabled={loading}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="btn-secondary" onClick={load} disabled={loading} title="Aktualisieren">
            <RefreshCw size={15} strokeWidth={2} />
            Aktualisieren
          </button>
        </div>
      </div>

      {loading && (
        <div className="inq-state">
          <div className="inq-state__icon"><Loader2 size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">Lade Analytics…</p>
        </div>
      )}

      {!loading && error && (
        <div className="inq-state">
          <div className="inq-state__icon"><AlertCircle size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">{error}</p>
          <button className="inq-state__retry" onClick={load}>Erneut versuchen</button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* KPI-Cards */}
          <div className="an-kpi-grid">
            <KpiCard
              label="Umsatz (Zeitraum)"
              value={fmt(data.kpi.periodRevenue)}
              sub={`Ø ${fmt(data.kpi.avgOrderValue)} pro Bestellung`}
              icon={TrendingUp}
              accent="var(--clr-accent)"
            />
            <KpiCard
              label="Bestellungen gesamt"
              value={String(data.kpi.totalOrders)}
              sub={`${data.kpi.paidOrders} bezahlt`}
              icon={ShoppingCart}
            />
            <KpiCard
              label="Gesamtumsatz (ever)"
              value={fmt(data.kpi.allTimeRevenue)}
              icon={Package}
            />
            <KpiCard
              label="Rabatte vergeben"
              value={fmt(data.kpi.discountTotal)}
              sub="im Zeitraum"
              icon={Tag}
              accent="#10b981"
            />
          </div>

          {/* Umsatz-Verlauf */}
          <div className="an-card">
            <div className="an-card__header">
              <h2 className="an-card__title">Umsatz & Bestellungen</h2>
              <span className="an-card__sub">Letzte {period} Tage</span>
            </div>
            <div className="an-card__body">
              {chartData.every(d => d.revenue === 0 && d.orders === 0) ? (
                <div className="an-empty">Noch keine Bestellungen im Zeitraum.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--clr-accent)"  stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--clr-accent)"  stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border, rgba(255,255,255,0.07))" vertical={false} />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 11, fill: 'var(--clr-text-secondary, #888)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={period === 7 ? 0 : period === 30 ? 4 : 9}
                    />
                    <YAxis
                      tickFormatter={fmtShort}
                      tick={{ fontSize: 11, fill: 'var(--clr-text-secondary, #888)' }}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                      domain={[0, Math.ceil(maxRevenue * 1.1)]}
                    />
                    <Tooltip content={<RevenueTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--clr-accent)"
                      strokeWidth={2}
                      fill="url(#revenueGrad)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top-Produkte + Status-Verteilung */}
          <div className="an-two-col">
            {/* Top-Produkte */}
            <div className="an-card">
              <div className="an-card__header">
                <h2 className="an-card__title">Top-Produkte</h2>
                <span className="an-card__sub">nach Umsatz</span>
              </div>
              <div className="an-card__body">
                {data.topProducts.length === 0 ? (
                  <div className="an-empty">Keine Bestelldaten im Zeitraum.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={data.topProducts}
                      layout="vertical"
                      margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border, rgba(255,255,255,0.07))" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={fmtShort}
                        tick={{ fontSize: 10, fill: 'var(--clr-text-secondary, #888)' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 11, fill: 'var(--clr-text, #ccc)' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 15) + '…' : v}
                      />
                      <Tooltip
                        formatter={(v: number) => [fmt(v), 'Umsatz']}
                        contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Bar dataKey="revenue" fill="var(--clr-accent)" radius={[0, 4, 4, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Status-Verteilung */}
            <div className="an-card">
              <div className="an-card__header">
                <h2 className="an-card__title">Bestellstatus</h2>
                <span className="an-card__sub">Verteilung</span>
              </div>
              <div className="an-card__body">
                {pieData.length === 0 ? (
                  <div className="an-empty">Keine Daten im Zeitraum.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => <span style={{ fontSize: '11px', color: 'var(--clr-text)' }}>{value}</span>}
                      />
                      <Tooltip
                        formatter={(v: number, name: string) => [v, name]}
                        contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: '8px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Bestellungen-Balken */}
          <div className="an-card">
            <div className="an-card__header">
              <h2 className="an-card__title">Bestellungen pro Tag</h2>
              <span className="an-card__sub">Letzte {period} Tage</span>
            </div>
            <div className="an-card__body">
              {chartData.every(d => d.orders === 0) ? (
                <div className="an-empty">Keine Bestellungen im Zeitraum.</div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border, rgba(255,255,255,0.07))" vertical={false} />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 11, fill: 'var(--clr-text-secondary, #888)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={period === 7 ? 0 : period === 30 ? 4 : 9}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: 'var(--clr-text-secondary, #888)' }}
                      tickLine={false}
                      axisLine={false}
                      width={30}
                    />
                    <Tooltip
                      formatter={(v: number) => [v, 'Bestellungen']}
                      contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="orders" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
