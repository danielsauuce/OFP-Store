const FormField = ({ id, name, label, icon: Icon, error, ...inputProps }) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-foreground">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </label>
      )}
      <input
        id={id}
        name={name}
        className={`w-full h-10 px-3 rounded-md bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
          error ? 'border-destructive' : 'border-border'
        }`}
        {...inputProps}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default FormField;
