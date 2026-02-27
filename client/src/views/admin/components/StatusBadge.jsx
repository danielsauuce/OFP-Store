const StatusBadge = ({ status, statusStyles }) => {
  const style = statusStyles[status] || 'bg-muted text-muted-foreground';
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
