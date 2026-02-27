import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useState, useRef } from 'react';
import { loginSchema, validateForm } from '../validation/formSchemas';
import gsap from 'gsap';

const LoginInputFields = [
  {
    id: 'login-email',
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'you@example.com',
    icon: Mail,
  },
  {
    id: 'login-password',
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
    icon: Lock,
  },
];

const LoginForm = ({ handleLogin }) => {
  const [signin, setSignin] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  const onSubmit = (e) => {
    e.preventDefault();

    const { success, data, errors: validationErrors } = validateForm(loginSchema, signin);

    if (!success) {
      setErrors(validationErrors);

      // Shake the fields that have errors
      if (formRef.current) {
        const errorFields = Object.keys(validationErrors);
        errorFields.forEach((fieldName) => {
          const el = formRef.current.querySelector(`[name="${fieldName}"]`);
          if (el) {
            gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
          }
        });
      }
      return;
    }

    setErrors({});
    handleLogin(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignin((prev) => ({ ...prev, [name]: value }));

    // Clear the error for this field as user types
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const isFormFilled = signin.email !== '' && signin.password !== '';

  return (
    <form ref={formRef} className="space-y-7 w-full mt-4 p-3" onSubmit={onSubmit}>
      {LoginInputFields.map((field) => {
        const Icon = field.icon;
        const hasError = !!errors[field.name];

        return (
          <div key={field.id} className="space-y-1.5">
            <label htmlFor={field.id} className="text-foreground font-medium">
              {field.label}
            </label>

            <div className="relative">
              <Icon
                className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${
                  hasError ? 'text-destructive' : 'text-muted-foreground'
                }`}
              />

              <input
                id={field.id}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                className={`w-full h-12 pl-12 pr-4 rounded-md bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:bg-card transition-colors ${
                  hasError
                    ? 'border-destructive focus:ring-destructive/40'
                    : 'border-border focus:ring-primary'
                }`}
                value={signin[field.name]}
                onChange={handleChange}
              />
            </div>

            {/* Inline error message */}
            {hasError && <p className="text-sm text-destructive pl-1">{errors[field.name]}</p>}
          </div>
        );
      })}

      <div className="flex items-center justify-end">
        <button
          type="button"
          className="text-sm text-primary hover:text-primary-light transition-colors"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={!isFormFilled}
        className={`w-full py-4 font-medium transition-all rounded duration-300 group justify-center flex ${
          isFormFilled
            ? 'bg-primary hover:bg-primary-dark text-primary-foreground'
            : 'bg-muted text-muted-foreground cursor-not-allowed border'
        }`}
      >
        <span className="flex items-center gap-2">
          Login
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>
    </form>
  );
};

export default LoginForm;
