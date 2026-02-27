import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react';

export const dashboardStats = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1% from last month',
    icon: DollarSign,
  },
  {
    title: 'Total Orders',
    value: '324',
    change: '+15% from last month',
    icon: ShoppingCart,
  },
  {
    title: 'Products',
    value: '156',
    change: '+8 new this month',
    icon: Package,
  },
  {
    title: 'Active Users',
    value: '2,842',
    change: '+180 new this week',
    icon: Users,
  },
];

export const recentOrders = [
  { id: 1001, customer: 'James Wilson', amount: 299.99, status: 'Pending' },
  { id: 1002, customer: 'Sarah Chen', amount: 599.98, status: 'Processing' },
  { id: 1003, customer: 'Michael Brown', amount: 899.97, status: 'Pending' },
];

export const topProducts = [
  { name: 'Classic Leather Sofa', sales: 45 },
  { name: 'Modern Dining Table', sales: 38 },
  { name: 'Ergonomic Office Chair', sales: 32 },
];
