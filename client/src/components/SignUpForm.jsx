import { useState } from 'react';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/authContext';

const signupFields = [
  {
    id: 'signup-name',
    name: 'fullName',
    label: 'Full Name',
    type: 'text',
    placeholder: 'John Doe',
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

const SignUpForm = () => {
  const signUpFormData = { fullName: '', email: '', password: '' };
  const [signup, setSignup] = useState(signUpFormData);
  const { signUp } = useAuth();

  // const handleSignUp = async () => {};

  return (
    <form className="space-y-5" onSubmit={signUp()}>
      {signupFields.map((field) => {
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
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                required
                className="w-full h-12 pl-12 pr-4 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-colors"
                value={signup[field.name] || ''}
                onChange={(e) => {
                  setSignup((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  }));
                }}
              />
            </div>
          </div>
        );
      })}

      <button
        type="submit"
        className="w-full h-13 text-amber-50 font-medium bg-primary hover:bg-primary-dark transition-all duration-300 group justify-center flex"
      >
        <span className="flex items-center gap-2">
          Create Account
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>

      <p className="text-center text-sm text-muted-foreground">
        By signing up, you agree to our{' '}
        <a href="#" className="text-primary hover:underline">
          Terms{' '}
        </a>
        and{' '}
        <a href="#" className="text-primary hover:underline">
          Privacy Policy
        </a>
      </p>
    </form>
  );
};

export default SignUpForm;
