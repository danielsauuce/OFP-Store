import { useState, useEffect } from 'react';
import {
  CreditCard,
  Loader,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Banknote,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { getPaymentStatsService } from '../../services/adminService';

const STATUS_CONFIG = {
  succeeded: {
    label: 'Succeeded',
    icon: CheckCircle2,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    color: '#22c55e',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    color: '#f59e0b',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    dot: 'bg-destructive',
    color: '#ef4444',
  },
  refunded: {
    label: 'Refunded',
    icon: RotateCcw,
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
    color: '#94a3b8',
  },
};

const METHOD_LABEL = {
  card: 'Card',
  pay_on_delivery: 'Pay on Delivery',
};

function StatCard({ title, value, sub, icon: Icon, colorClass }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${colorClass || 'text-foreground'}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'revenue'
            ? `₦${Number(p.value).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : p.value}{' '}
          {p.name === 'count' ? 'payments' : ''}
        </p>
      ))}
    </div>
  );
};

function Payments() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getPaymentStatsService();
      if (data?.success) setStats(data.stats);
    } catch {
      // stats remain null
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
        <CreditCard className="h-10 w-10 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Failed to load payment data</p>
        <button onClick={() => load()} className="text-sm text-primary hover:underline mt-1">
          Try again
        </button>
      </div>
    );
  }

  const succeededCount = stats.statusBreakdown?.succeeded?.count || 0;
  const pendingCount = stats.statusBreakdown?.pending?.count || 0;
  const failedCount = stats.statusBreakdown?.failed?.count || 0;
  const refundedCount = stats.statusBreakdown?.refunded?.count || 0;

  // Pie chart data
  const pieData = Object.entries(STATUS_CONFIG)
    .map(([status, cfg]) => ({
      name: cfg.label,
      value: stats.statusBreakdown?.[status]?.count || 0,
      color: cfg.color,
    }))
    .filter((d) => d.value > 0);

  // Area chart data — fill gaps in daily revenue with 0
  const areaData = (() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    // Create lookup from backend data
    const lookup = {};
    (stats.dailyRevenue || []).forEach((d) => {
      const dateStr = d._id; // Assuming _id is already in 'YYYY-MM-DD' format
      lookup[dateStr] = { revenue: d.revenue, count: d.count };
    });

    // Generate all dates in range
    const result = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
      const data = lookup[dateStr] || { revenue: 0, count: 0 };

      result.push({
        date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        revenue: data.revenue,
        count: data.count,
      });
    }
    return result;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of all transactions</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₦${stats.totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={`${succeededCount} successful`}
          icon={TrendingUp}
          colorClass="text-primary"
        />
        <StatCard
          title="Total Payments"
          value={stats.totalPayments}
          sub="All time"
          icon={CreditCard}
        />
        <StatCard
          title="Succeeded"
          value={succeededCount}
          icon={CheckCircle2}
          colorClass="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Failed / Pending"
          value={failedCount + pendingCount}
          sub={`${refundedCount} refunded`}
          icon={XCircle}
          colorClass="text-destructive"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue area chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Revenue (Last 30 Days)</h2>
          {areaData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c5c40" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7c5c40" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₦${Number(v).toLocaleString('en-NG')}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c5c40"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Payment Status</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: 'hsl(var(--foreground))' }}>{value}</span>
                  )}
                />
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Method + status breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">By Status</h2>
          <div className="space-y-3">
            {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
              const d = stats.statusBreakdown?.[status];
              if (!d) return null;
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{d.count} payments</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      ₦
                      {d.total.toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">By Payment Method</h2>
          {Object.keys(stats.revenueByMethod || {}).length === 0 ? (
            <p className="text-sm text-muted-foreground">No succeeded payments yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.revenueByMethod).map(([method, d]) => (
                <div key={method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {method === 'card' ? (
                      <CreditCard className="h-4 w-4 text-primary" />
                    ) : (
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {METHOD_LABEL[method] || method}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{d.count} payments</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      ₦
                      {d.total.toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent payments table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Payments</h2>
        </div>
        {!stats.recentPayments?.length ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground opacity-20" />
            <p className="text-sm text-muted-foreground">No payments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Customer', 'Order', 'Method', 'Amount', 'Status', 'Date'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((payment) => {
                  const cfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                  return (
                    <tr
                      key={payment._id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-foreground">
                          {payment.user?.fullName || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">{payment.user?.email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {payment.order?.orderNumber || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          {payment.paymentMethod === 'card' ? (
                            <CreditCard className="h-3.5 w-3.5" />
                          ) : (
                            <Banknote className="h-3.5 w-3.5" />
                          )}
                          {METHOD_LABEL[payment.paymentMethod] || payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-foreground tabular-nums">
                        ₦
                        {payment.amount.toLocaleString('en-NG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(payment.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payments;
