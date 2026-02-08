import MetricCard from '../components/MetricCard';
import ProgressBar from '../components/ProgressBar';
import { metrics, topCategories, salesPerformance } from '../../data/AnalyticsData';

const Analytics = () => {
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
            trend={metric.trend}
            icon={metric.icon}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Best Selling Categories */}
        <div className="bg-card p-6 rounded-lg shadow-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Best Selling Categories</h2>
          <div className="space-y-4">
            {topCategories.map((category, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-foreground">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.sales} units sold</p>
                </div>
                <p className="font-bold text-primary">{category.revenue}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Performance */}
        <div className="bg-card p-6 rounded-lg shadow-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Sales Performance</h2>
          <div className="space-y-4">
            {salesPerformance.map((item, index) => (
              <ProgressBar
                key={index}
                label={item.label}
                amount={item.amount}
                width={item.width}
                opacity={item.opacity}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
