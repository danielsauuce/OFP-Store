import { useState, useEffect } from 'react';
import { Loader, TrendingUp, Users, ShoppingCart, Package } from 'lucide-react';
import MetricCard from './components/MetricCard';
import { getDashboardStatsService } from '../../services/adminService';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStatsService();
      if (data?.success) {
        setStats(data.stats);
      } else {
        setError('Failed to load analytics');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">Insights and performance metrics</p>
        </div>
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
          <p>{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Users',
      value: stats?.totalUsers?.toLocaleString() || '0',
      description: 'Registered accounts',
      icon: Users,
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders?.toLocaleString() || '0',
      description: 'Orders placed',
      icon: ShoppingCart,
    },
    {
      title: 'Active Products',
      value: stats?.totalProducts?.toLocaleString() || '0',
      description: 'Products in catalog',
      icon: Package,
    },
    {
      title: 'Recent Activity',
      value: stats?.recentOrders?.length?.toString() || '0',
      description: 'Orders in latest batch',
      icon: TrendingUp,
    },
  ];

  // Compute order status distribution from recent orders
  const statusCounts = {};
  stats?.recentOrders?.forEach((order) => {
    const s = order.orderStatus || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const totalRecent = stats?.recentOrders?.length || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Insights and performance metrics for your store
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Order Status Distribution */}
        <div className="bg-card p-6 rounded-lg shadow-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Recent Order Status Distribution
          </h2>
          {Object.keys(statusCounts).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(statusCounts).map(([status, count]) => {
                const pct = Math.round((count / totalRecent) * 100);
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{status}</span>
                      <span className="font-medium text-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent order data available</p>
          )}
        </div>

        {/* Recent Orders Summary */}
        <div className="bg-card p-6 rounded-lg shadow-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Latest Orders</h2>
          {stats?.recentOrders?.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">#{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.orderStatus}</p>
                  </div>
                  <p className="font-bold text-primary">£{order.total?.toFixed(2) || '0.00'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent orders</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
