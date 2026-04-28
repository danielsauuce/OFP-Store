import { useState, useEffect } from 'react';
import { Loader, TrendingUp, Users, ShoppingCart, Package, RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { getDashboardStatsService } from '../../services/adminService';

const STATUS_COLORS = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill || p.color }}>
          {p.name}:{' '}
          {p.dataKey === 'revenue'
            ? `₦${Number(p.value).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStatsService();
      if (data?.success) setStats(data.stats);
      else setError('Failed to load analytics');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
          <p>{error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const pieData = Object.entries(stats?.ordersByStatus || {}).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: STATUS_COLORS[status] || '#94a3b8',
  }));

  const chartData = (() => {
    const raw = stats?.ordersLast30Days || [];
    const map = {};
    raw.forEach((d) => {
      map[d._id] = d;
    });
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        date: d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        orders: map[key]?.orders || 0,
        revenue: map[key]?.revenue || 0,
      };
    });
  })();

  const weeklyData = Array.from({ length: 4 }, (_, w) => {
    const slice = chartData.slice(w * 7, w * 7 + 7);
    return {
      week: `Week ${w + 1}`,
      orders: slice.reduce((s, d) => s + d.orders, 0),
      revenue: slice.reduce((s, d) => s + d.revenue, 0),
    };
  });

  const totalRevenue30d = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders30d = chartData.reduce((s, d) => s + d.orders, 0);

  const summaryCards = [
    {
      label: 'Revenue (30d)',
      value: `₦${totalRevenue30d.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Orders (30d)',
      value: totalOrders30d,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Users',
      value: (stats?.totalUsers || 0).toLocaleString(),
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Products',
      value: (stats?.totalProducts || 0).toLocaleString(),
      icon: Package,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Performance insights for your store
          </p>
        </div>
        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Daily revenue line */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="font-semibold text-foreground">Daily Revenue</h2>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₦${Number(v).toLocaleString('en-NG')}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly orders bar */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="font-semibold text-foreground">Weekly Orders</h2>
            <p className="text-xs text-muted-foreground">Last 4 weeks</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="font-semibold text-foreground">Order Status</h2>
            <p className="text-xs text-muted-foreground">All time distribution</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="42%"
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
              No order data yet
            </div>
          )}
        </div>
      </div>

      {/* Weekly revenue bar */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="font-semibold text-foreground">Weekly Revenue</h2>
          <p className="text-xs text-muted-foreground">Last 4 weeks</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₦${Number(v).toLocaleString('en-NG')}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Analytics;
