import { useState, useRef } from 'react';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { signupSchema, validateForm } from '../validation/formSchemas';
import gsap from 'gsap';

const signupFields = [
  {
    id: 'signup-name',
    name: 'fullName',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Bryan Thebold',
    icon: User,
  },
  {
    id: 'signup-email',
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
    icon: Mail,
  },
  {
    id: 'signup-password',
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
    icon: Lock,
  },
];

const SignUpForm = ({ handleSignUp }) => {
  const [signup, setSignup] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  const onSubmit = (e) => {
    e.preventDefault();

    const { success, data, errors: validationErrors } = validateForm(signupSchema, signup);

    if (!success) {
      setErrors(validationErrors);

      // Shake error fields
      if (formRef.current) {
        Object.keys(validationErrors).forEach((fieldName) => {
          const el = formRef.current.querySelector(`[name="${fieldName}"]`);
          if (el) {
            gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
          }
        });
      }
      return;
    }

    setErrors({});
    handleSignUp(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignup((prev) => ({ ...prev, [name]: value }));

    // Clear error as user types
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const isFormFilled =
    signup.fullName.trim() !== '' && signup.email.trim() !== '' && signup.password.trim() !== '';

  return (
    <form ref={formRef} className="space-y-5" onSubmit={onSubmit}>
      {signupFields.map((field) => {
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
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                className={`w-full h-12 pl-12 pr-4 rounded-md bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:bg-card transition-colors ${
                  hasError
                    ? 'border-destructive focus:ring-destructive/40'
                    : 'border-border focus:ring-primary'
                }`}
                value={signup[field.name]}
                onChange={handleChange}
              />
            </div>

            {/* Inline error message */}
            {hasError && <p className="text-sm text-destructive pl-1">{errors[field.name]}</p>}
          </div>
        );
      })}

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
          Create Account
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>

      <p className="text-center text-sm text-muted-foreground">
        By signing up, you agree to our{' '}
        <a href="#" className="text-primary hover:underline">
          Terms
        </a>{' '}
        and{' '}
        <a href="#" className="text-primary hover:underline">
          Privacy Policy
        </a>
      </p>
    </form>
  );
};

export default SignUpForm;