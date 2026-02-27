import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Package, Truck } from 'lucide-react';
import gsap from 'gsap';

const statusSteps = [
  {
    icon: Package,
    title: 'Processing your order',
    description: "We'll send you an email confirmation shortly",
  },
  {
    icon: Truck,
    title: 'Estimated delivery',
    description: '3–7 business days',
  },
];

const actions = [
  { to: '/shop', label: 'Continue Shopping', primary: true },
  { to: '/profile', label: 'View Orders', primary: false },
];

const OrderConfirmation = ({ orderNumber }) => {
  const pageRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Success icon
      tl.from('.confirm-icon-wrapper', {
        scale: 0,
        duration: 0.7,
        ease: 'back.out(2)',
      }).fromTo(
        '.confirm-ring',
        { scale: 1, opacity: 0.5 },
        {
          scale: 2.5,
          opacity: 0,
          duration: 1,
          ease: 'power2.out',
        },
        '-=0.5',
      );

      // Checkmark spins in
      tl.from(
        '.confirm-check',
        {
          rotation: -180,
          scale: 0,
          duration: 0.5,
          ease: 'back.out(2)',
        },
        '-=0.8',
      );

      // Title + subtitle cascade
      tl.from('.confirm-title', { y: 30, opacity: 0, duration: 0.7 }, '-=0.3')
        .from('.confirm-subtitle', { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
        .from(
          '.confirm-order-num',
          {
            y: 15,
            opacity: 0,
            scale: 0.9,
            duration: 0.5,
            ease: 'back.out(1.5)',
          },
          '-=0.2',
        );

      // Info card slides up
      tl.from('.confirm-card', { y: 40, opacity: 0, duration: 0.7 }, '-=0.2');

      // Status steps stagger
      const steps = gsap.utils.toArray('.confirm-step');
      tl.from(
        steps,
        {
          x: -30,
          opacity: 0,
          duration: 0.5,
          stagger: 0.15,
        },
        '-=0.3',
      );

      // Buttons
      tl.from(
        '.confirm-btn',
        {
          y: 20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: 'back.out(1.3)',
          clearProps: 'all',
        },
        '-=0.2',
      );
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen py-12 bg-background text-foreground">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        {/* Success Icon with ring pulse */}
        <div className="relative inline-flex items-center justify-center mb-6">
          {/* Expanding ring */}
          <div className="confirm-ring absolute w-20 h-20 rounded-full border-2 border-accent" />
          {/* Icon container */}
          <div className="confirm-icon-wrapper w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
            <CheckCircle className="confirm-check h-10 w-10 text-accent" />
          </div>
        </div>

        <h1 className="confirm-title text-3xl font-serif font-bold mb-3">Order Confirmed!</h1>
        <p className="confirm-subtitle text-muted-foreground mb-2">Thank you for your purchase</p>

        <span className="confirm-order-num inline-block px-4 py-1 rounded-full text-base font-medium bg-muted text-muted-foreground mb-8">
          {orderNumber}
        </span>

        {/* Info Card */}
        <div className="confirm-card bg-card rounded-lg border border-border shadow-card p-6 space-y-4 text-left mb-8">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index}>
                <div className="confirm-step flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index !== statusSteps.length - 1 && (
                  <div className="border-t border-border mt-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {actions.map((action, index) => (
            <Link
              key={index}
              to={action.to}
              className={`confirm-btn px-6 py-3 rounded-md font-medium transition-colors ${
                action.primary
                  ? 'bg-primary text-primary-foreground hover:bg-primary-dark'
                  : 'border border-border text-foreground hover:bg-muted'
              }`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
