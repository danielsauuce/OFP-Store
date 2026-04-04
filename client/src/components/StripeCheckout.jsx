import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader, ShieldCheck, CreditCard, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ onSuccess, total, billingCountry, billingPostalCode }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || processing) return;

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/profile?tab=orders`,
          payment_method_data: {
            billing_details: {
              address: {
                country: billingCountry || 'NG',
                postal_code: billingPostalCode || null,
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess();
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        toast('Payment is processing. You will be notified when it completes.', { icon: '⏳' });
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Test mode notice */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
        <CreditCard className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Test mode:</span> Use card{' '}
          <span className="font-mono font-semibold">4242 4242 4242 4242</span>, any future expiry,
          any CVC, and any postcode.
        </p>
      </div>

      <PaymentElement
        options={{
          layout: 'tabs',
          fields: {
            billingDetails: {
              address: {
                country: 'never',
                postalCode: 'never',
              },
            },
          },
        }}
      />

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
      >
        {processing ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            Processing Payment…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pay £{total?.toFixed(2)} securely
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Powered by Stripe · 256-bit SSL encrypted</span>
      </div>
    </form>
  );
}

function StripeCheckout({ clientSecret, onSuccess, total, billingCountry, billingPostalCode }) {
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: 'hsl(25 30% 35%)',
      colorBackground: 'hsl(0 0% 100%)',
      colorText: 'hsl(25 30% 15%)',
      colorDanger: 'hsl(0 72% 51%)',
      colorTextPlaceholder: 'hsl(25 10% 55%)',
      borderRadius: '8px',
      fontSizeBase: '14px',
    },
    rules: {
      '.Input': {
        border: '1px solid hsl(40 20% 85%)',
        boxShadow: 'none',
      },
      '.Input:focus': {
        boxShadow: '0 0 0 2px rgba(116, 85, 62, 0.2)',
        border: '1px solid hsl(25 30% 35%)',
      },
      '.Label': {
        fontWeight: '500',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'hsl(25 10% 45%)',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <PaymentForm
        onSuccess={onSuccess}
        total={total}
        billingCountry={billingCountry}
        billingPostalCode={billingPostalCode}
      />
    </Elements>
  );
}

export default StripeCheckout;
