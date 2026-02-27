import { Sparkles } from 'lucide-react';
import { useState, useLayoutEffect, useRef, useCallback } from 'react';
import SignUpForm from './SignUpForm';
import LoginForm from './LoginForm';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

const RightPanelAuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { signUp, signIn, isLoading } = useAuth();
  const navigate = useNavigate();

  const panelRef = useRef(null);
  const formContainerRef = useRef(null);
  const hasAnimated = useRef(false);

  // Initial entrance animation — runs once
  useLayoutEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Mobile logo
      tl.from('.auth-mobile-logo', {
        y: -20,
        opacity: 0,
        duration: 0.6,
      });

      // Heading + subtitle
      tl.from(
        '.auth-right-heading',
        {
          y: 40,
          opacity: 0,
          duration: 0.8,
        },
        '-=0.3',
      ).from(
        '.auth-right-subtitle',
        {
          y: 20,
          opacity: 0,
          duration: 0.6,
        },
        '-=0.4',
      );

      // Tab toggle slides up
      tl.from(
        '.auth-toggle',
        {
          y: 30,
          opacity: 0,
          duration: 0.6,
          ease: 'back.out(1.3)',
        },
        '-=0.3',
      );

      // Form container fades in
      tl.from(
        formContainerRef.current,
        {
          y: 40,
          opacity: 0,
          duration: 0.7,
        },
        '-=0.3',
      );
    }, panelRef);

    return () => ctx.revert();
  }, []);

  // Animate form swap when toggling between login/signup
  const animateFormSwap = useCallback((toLogin) => {
    if (!formContainerRef.current) return;

    const tl = gsap.timeline();

    // Slide out current form
    tl.to(formContainerRef.current, {
      x: toLogin ? 30 : -30,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        setIsLogin(toLogin);
      },
    });

    // Slide in new form from opposite direction
    tl.fromTo(
      formContainerRef.current,
      { x: toLogin ? -30 : 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' },
    );
  }, []);

  const handleTabClick = (toLogin) => {
    if (toLogin === isLogin || isLoading) return;
    animateFormSwap(toLogin);
  };

  const handleSignUp = async (signupData) => {
    const result = await signUp(signupData);

    if (result?.success) {
      animateFormSwap(true);
    }
  };

  const handleLogin = async (loginData) => {
    const result = await signIn(loginData);

    if (result?.success) {
      navigate('/');
    }
  };

  return (
    <div
      ref={panelRef}
      className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Mobile Logo */}
        <div className="text-center mb-8">
          <div className="auth-mobile-logo lg:hidden">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-2xl font-serif font-bold text-primary">Olayinka</span>
            </div>
            <p className="text-muted-foreground text-sm mb-5">Furniture Palace</p>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="auth-right-heading text-3xl font-serif font-bold text-foreground mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="auth-right-subtitle text-muted-foreground">
              {isLogin
                ? 'Enter your credentials to access your account'
                : 'Start your journey with us today'}
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="auth-toggle flex bg-muted p-1 rounded-xl mt-5">
          <button
            type="button"
            onClick={() => handleTabClick(true)}
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
            onClick={() => handleTabClick(false)}
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

        {/* Form Container — animated on swap */}
        <div ref={formContainerRef}>
          {isLogin ? (
            <LoginForm handleLogin={handleLogin} />
          ) : (
            <SignUpForm handleSignUp={handleSignUp} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RightPanelAuthPage;
