import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useState } from 'react';

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
  const loginFormData = { email: '', password: '' };
  const [signin, setSignin] = useState(loginFormData);

  const onSubmit = (e) => {
    e.preventDefault();
    handleLogin(signin);
  };

  return (
    <form className="space-y-7 w-full mt-4 p-3" onSubmit={onSubmit}>
      {LoginInputFields.map((field) => {
        const Icon = field.icon;

        return (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-foreground font-medium">
              {field.label}
            </label>

            <div className="relative">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

              <input
                id={field.id}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                required
                className="w-full h-12 pl-12 pr-4 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-colors"
                value={signin[field.name]}
                onChange={(e) => setSignin({ ...signin, [e.target.name]: e.target.value })}
              />
            </div>
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
        className="w-full h-13 text-amber-50 font-medium bg-primary hover:bg-primary-dark transition-all duration-300 group justify-center flex"
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
