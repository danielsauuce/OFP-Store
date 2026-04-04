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
} from 'lucide-react';
import { getPaymentStatsService } from '../../services/adminService';

const STATUS_CONFIG = {
  succeeded: {
    label: 'Succeeded',
    icon: CheckCircle2,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    dot: 'bg-destructive',
  },
  refunded: {
    label: 'Refunded',
    icon: RotateCcw,
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
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

function Payments() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getPaymentStatsService();
      if (data?.success) setStats(data.stats);
    } catch {
      // stats remain null
    } finally {
      setLoading(false);
    }
  };

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
      </div>
    );
  }

  const succeededCount = stats.statusBreakdown?.succeeded?.count || 0;
  const pendingCount = stats.statusBreakdown?.pending?.count || 0;
  const failedCount = stats.statusBreakdown?.failed?.count || 0;
  const refundedCount = stats.statusBreakdown?.refunded?.count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-serif text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of all transactions</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`£${(stats.totalRevenue / 100).toFixed(2)}`}
          sub={`${succeededCount} successful payments`}
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">By Status</h2>
          <div className="space-y-3">
            {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
              const d = stats.statusBreakdown?.[status];
              if (!d) return null;
              const Icon = cfg.icon;
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{d.count} payments</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      £{(d.total / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by method */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">By Payment Method</h2>
          {Object.keys(stats.revenueByMethod || {}).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
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
                      £{(d.total / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Payments</h2>
        </div>
        {stats.recentPayments?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground opacity-20" />
            <p className="text-sm text-muted-foreground">No payments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Order
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Method
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Date
                  </th>
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
                        <div>
                          <p className="font-medium text-foreground">
                            {payment.user?.fullName || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">{payment.user?.email}</p>
                        </div>
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
                        £{(payment.amount / 100).toFixed(2)}
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
