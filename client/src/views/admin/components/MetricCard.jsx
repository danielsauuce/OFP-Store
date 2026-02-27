const MetricCard = ({ title, value, description, trend, icon: Icon }) => {
  return (
    <div className="bg-card p-6 rounded-lg shadow-card hover:scale-[1.03] transition-transform border border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && (
          <Icon className={`h-4 w-4 ${trend === 'up' ? 'text-accent' : 'text-destructive'}`} />
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
};

export default MetricCard;
