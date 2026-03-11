import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, Loader } from 'lucide-react';
import MetricCard from './components/MetricCard';
import StatusBadge from './components/StatusBadge';
import { getDashboardStatsService } from '../../services/adminService';

const statusStyles = {
  delivered: 'bg-accent/20 text-accent',
  pending: 'bg-gold/20 text-gold',
  processing: 'bg-primary/20 text-primary',
  shipped: 'bg-accent/20 text-accent',
  cancelled: 'bg-destructive/20 text-destructive',
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStatsService();
      if (data?.success) {
        setStats(data.stats);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
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
          <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">Welcome back!</p>
        </div>
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
          <p>{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers?.toLocaleString() || '0',
      description: 'Registered users',
      icon: Users,
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders?.toLocaleString() || '0',
      description: 'All time orders',
      icon: ShoppingCart,
    },
    {
      title: 'Active Products',
      value: stats?.totalProducts?.toLocaleString() || '0',
      description: 'Products in catalog',
      icon: Package,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <MetricCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-card p-6 rounded-lg shadow-card border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h2>

        {stats?.recentOrders?.length > 0 ? (
          <div className="space-y-4">
            {stats.recentOrders.map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-foreground">Order #{order.orderNumber}</p>
                    <StatusBadge status={order.orderStatus} statusStyles={statusStyles} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.user?.fullName || order.user?.email || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    £{order.total?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No recent orders</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
