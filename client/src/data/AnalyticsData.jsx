import { TrendingUp, TrendingDown } from 'lucide-react';

export const metrics = [
  {
    title: 'Sales Trend',
    value: '+25.3%',
    description: 'Compared to last month',
    trend: 'up',
    icon: TrendingUp,
  },
  {
    title: 'Conversion Rate',
    value: '3.2%',
    description: '0.5% increase from last week',
    trend: 'up',
    icon: TrendingUp,
  },
  {
    title: 'Average Order Value',
    value: '$425',
    description: '5% decrease from last month',
    trend: 'down',
    icon: TrendingDown,
  },
  {
    title: 'Customer Retention',
    value: '68%',
    description: '2% increase from last quarter',
    trend: 'up',
    icon: TrendingUp,
  },
];

export const topCategories = [
  { name: 'Sofas', sales: 45, revenue: '$58,495' },
  { name: 'Tables', sales: 38, revenue: '$34,196' },
  { name: 'Chairs', sales: 32, revenue: '$14,400' },
  { name: 'Beds', sales: 15, revenue: '$22,499' },
];

export const salesPerformance = [
  { label: 'This Month', amount: '$45,231', width: '75%', opacity: '' },
  { label: 'Last Month', amount: '$36,142', width: '60%', opacity: '/60' },
  { label: '3 Months Ago', amount: '$28,956', width: '48%', opacity: '/40' },
];
