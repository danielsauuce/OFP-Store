import { useId } from 'react';

const FormField = ({ id, name, label, icon: Icon, error, ...inputProps }) => {
  const generatedId = useId();
  const fieldId = id || `field-${generatedId}`;
  const errorId = `${fieldId}-error`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={fieldId}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </label>
      )}
      <input
        id={fieldId}
        name={name}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full h-10 px-3 rounded-md bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
          error ? 'border-destructive' : 'border-border'
        }`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
