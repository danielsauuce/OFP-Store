import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import SignUpForm from './SignUpForm';
import LoginForm from './LoginForm';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';

// FIX: Removed unused props (checkIfSignUpFormIsValid, checkIfSignInFormIsValid)
const RightPanelAuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { signUp, signIn, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (signupData) => {
    const result = await signUp(signupData);

    if (result?.success) {
      setIsLogin(true);
    }
  };

  const handleLogin = async (loginData) => {
    const result = await signIn(loginData);

    if (result?.success) {
      navigate('/');
    }
  };

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Mobile Logo */}
        <div className="text-center mb-8">
          <div className="lg:hidden">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-2xl font-serif font-bold text-primary">Olayinka</span>
            </div>
            <p className="text-muted-foreground text-sm mb-5">Furniture Palace</p>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Enter your credentials to access your account'
                : 'Start your journey with us today'}
            </p>
          </div>
        </div>

        {/* Toggle button */}
        <div className="flex bg-muted p-1 rounded-xl mt-5">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              isLogin
                ? 'bg-card text-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              !isLogin
                ? 'bg-card text-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        {isLogin ? (
          <LoginForm handleLogin={handleLogin} />
        ) : (
          <SignUpForm handleSignUp={handleSignUp} />
        )}
      </div>
    </div>
  );
};

export default RightPanelAuthPage;
