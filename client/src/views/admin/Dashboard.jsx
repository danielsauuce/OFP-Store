import { useState, useEffect } from 'react';
import {
  Package,
  ShoppingCart,
  Users,
  Loader,
  TrendingUp,
  UserPlus,
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
import StatusBadge from './components/StatusBadge';
import { getDashboardStatsService } from '../../services/adminService';

const STATUS_STYLES = {
  delivered: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

function StatCard({ title, value, subtitle, icon: Icon, accentClass }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${accentClass}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5 truncate">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.dataKey === 'revenue' ? `£${Number(p.value).toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
};

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStatsService();
      if (data?.success) setStats(data.stats);
      else setError('Failed to load dashboard data');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
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
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
          <p>{error}</p>
          <button
            onClick={() => fetchStats()}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary-dark transition-colors"
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

  // Build 30-day chart filling missing dates with zeros
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
      // Format label from the UTC date to match the aggregation key and avoid timezone drift
      const utcDate = new Date(key + 'T00:00:00Z');
      return {
        date: utcDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        orders: map[key]?.orders || 0,
        revenue: map[key]?.revenue || 0,
      };
    });
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* quick-stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-semibold text-foreground">New Users</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats?.newUsersLast7Days || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">In the last 7 days</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-foreground">Pending</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {stats?.ordersByStatus?.pending || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Orders awaiting action</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-foreground">Delivered</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {stats?.ordersByStatus?.delivered || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Successfully completed</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`£${(stats?.totalRevenue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="From paid orders"
          icon={TrendingUp}
          accentClass="bg-primary"
        />
        <StatCard
          title="Total Orders"
          value={(stats?.totalOrders || 0).toLocaleString()}
          subtitle="All time"
          icon={ShoppingCart}
          accentClass="bg-blue-500"
        />
        <StatCard
          title="Registered Users"
          value={(stats?.totalUsers || 0).toLocaleString()}
          subtitle={`+${stats?.newUsersLast7Days || 0} this week`}
          icon={Users}
          accentClass="bg-violet-500"
        />
        <StatCard
          title="Active Products"
          value={(stats?.totalProducts || 0).toLocaleString()}
          subtitle="In catalogue"
          icon={Package}
          accentClass="bg-emerald-500"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-foreground">Revenue &amp; Orders</h2>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-orders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                yAxisId="rev"
                orientation="left"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `£${v}`}
              />
              <YAxis
                yAxisId="ord"
                orientation="right"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                yAxisId="rev"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#grad-revenue)"
              />
              <Area
                yAxisId="ord"
                type="monotone"
                dataKey="orders"
                name="Orders"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#grad-orders)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="font-semibold text-foreground">Order Status</h2>
            <p className="text-xs text-muted-foreground">All time breakdown</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="42%"
                  innerRadius={52}
                  outerRadius={76}
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

      {/* Recent orders table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recent Orders</h2>
          <span className="text-xs text-muted-foreground">Latest 8</span>
        </div>
        {stats?.recentOrders?.length > 0 ? (
          <div className="divide-y divide-border">
            {stats.recentOrders.map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-medium text-foreground">#{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.user?.fullName || order.user?.email || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <StatusBadge status={order.orderStatus} statusStyles={STATUS_STYLES} />
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      £{order.total?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">No orders yet</div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
