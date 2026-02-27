const ProgressBar = ({ label, amount, width, opacity = '' }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{amount}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-primary${opacity}`} style={{ width }} />
      </div>
    </div>
  );
};

export default ProgressBar;
