import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Loader,
  ShieldCheck,
  MapPin,
  CreditCard,
  Package,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext';
import { createOrderService } from '../services/orderService';
import { getUserProfileService } from '../services/userService';
import { shippingSchema, validateForm } from '../validation/formSchemas';
import FormField from '../components/FormField';
import StepProgressBar from '../components/StepProgressBar';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import OrderSummaryCard, {
  SHIPPING_THRESHOLD,
  SHIPPING_COST,
} from '../components/OrderSummaryCard';
import OrderConfirmation from '../components/OrderConfirmation';

const STEP_LABELS = ['Shipping', 'Payment', 'Review'];

const Checkout = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { cart, loading: cartLoading, fetchCart } = useCart();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const stepContentRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    if (!auth.authenticate) {
      toast.error('Please sign in to continue to checkout');
      navigate('/auth');
      return;
    }
    loadCheckoutData();
  }, [auth.authenticate]);

  const loadCheckoutData = async () => {
    try {
      // Ensure cart is loaded
      if (!cart?.items?.length) {
        await fetchCart();
      }

      // Pre-fill from profile
      const profileData = await getUserProfileService();
      if (profileData?.success && profileData.user) {
        const user = profileData.user;
        const defaultAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];

        setFormData({
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          street: defaultAddr?.street || '',
          city: defaultAddr?.city || '',
          state: defaultAddr?.state || '',
          postalCode: defaultAddr?.postalCode || '',
        });
      }
    } catch (error) {
      toast.error('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if cart becomes empty
  useEffect(() => {
    if (!loading && !cartLoading && !cart?.items?.length && !orderPlaced) {
      navigate('/cart');
    }
  }, [cart, loading, cartLoading, orderPlaced]);

  // GSAP step transition
  const animateStepChange = useCallback(() => {
    if (!stepContentRef.current || window.Cypress) return;
    gsap.fromTo(
      stepContentRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' },
    );
  }, []);

  useLayoutEffect(() => {
    animateStepChange();
  }, [step, animateStepChange]);

  // Page entrance
  useLayoutEffect(() => {
    if (loading || !pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.checkout-header', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
      });
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  // Form handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateShipping = () => {
    const { success, errors: zodErrors } = validateForm(shippingSchema, formData);
    if (!success) {
      setErrors(zodErrors);

      // Shake error fields
      if (stepContentRef.current) {
        Object.keys(zodErrors).forEach((fieldName) => {
          const el = stepContentRef.current.querySelector(`[name="${fieldName}"]`);
          if (el) {
            gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
          }
        });
      }
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateShipping()) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate('/cart');
  };

  // Submit order
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const orderData = {
        items: cart.items.map((item) => ({
          product: typeof item.product === 'object' ? item.product._id : item.product,
          variantSku: item.variantSku || undefined,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state || undefined,
          postalCode: formData.postalCode,
          country: 'Nigeria',
        },
        paymentMethod,
      };

      const data = await createOrderService(orderData);

      if (data?.success) {
        setOrderNumber(data.order.orderNumber);
        setOrderPlaced(true);
        toast.success('Order placed successfully!');
        // Refetch cart to clear it
        fetchCart();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Computed
  const subtotal = cart?.total || 0;
  const shipping = subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  if (loading || cartLoading || !cart) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orderPlaced) {
    return <OrderConfirmation orderNumber={orderNumber} />;
  }

  return (
    <div ref={pageRef} className="min-h-screen py-8 lg:py-12 bg-background text-foreground">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="checkout-header flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Checkout</h1>
            <p className="text-muted-foreground text-sm">
              Step {step} of 3 — {STEP_LABELS[step - 1]}
            </p>
          </div>
        </div>

        <StepProgressBar currentStep={step} totalSteps={3} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content — animated container */}
          <div ref={stepContentRef} className="lg:col-span-2 space-y-6">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <div className="bg-card rounded-lg border border-border shadow-card p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  Shipping Information
                </h2>

                <div className="space-y-4">
                  <FormField
                    id="fullName"
                    name="fullName"
                    label="Full Name *"
                    icon={User}
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    error={errors.fullName}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      id="email"
                      name="email"
                      type="email"
                      label="Email *"
                      icon={Mail}
                      value={formData.email}
                      onChange={handleInputChange}
                      error={errors.email}
                    />
                    <FormField
                      id="phone"
                      name="phone"
                      type="tel"
                      label="Phone *"
                      icon={Phone}
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234 800 000 0000"
                      error={errors.phone}
                    />
                  </div>

                  <FormField
                    id="street"
                    name="street"
                    label="Delivery Address *"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="Street address"
                    error={errors.street}
                  />

                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                      id="city"
                      name="city"
                      label="City *"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Lagos"
                      error={errors.city}
                    />
                    <FormField
                      id="state"
                      name="state"
                      label="State"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Lagos"
                    />
                    <FormField
                      id="postalCode"
                      name="postalCode"
                      label="Postal Code *"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="100001"
                      error={errors.postalCode}
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleNextStep}
                      className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="bg-card rounded-lg border border-border shadow-card p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </h2>

                <PaymentMethodSelector selected={paymentMethod} onChange={setPaymentMethod} />

                <div className="pt-6">
                  <button
                    onClick={handleNextStep}
                    className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-card rounded-lg border border-border shadow-card p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      Shipping To
                    </h3>
                    <button
                      onClick={() => setStep(1)}
                      className="text-sm text-primary hover:text-primary-light transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="font-medium text-foreground">{formData.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.street}, {formData.city}
                    {formData.state ? `, ${formData.state}` : ''}, {formData.postalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.email} · {formData.phone}
                  </p>
                </div>

                <div className="bg-card rounded-lg border border-border shadow-card p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Payment
                    </h3>
                    <button
                      onClick={() => setStep(2)}
                      className="text-sm text-primary hover:text-primary-light transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="font-medium text-foreground">
                    {paymentMethod === 'card' ? 'Credit / Debit Card' : 'Pay on Delivery'}
                  </p>
                </div>

                <div className="bg-card rounded-lg border border-border shadow-card p-6">
                  <h3 className="text-base font-semibold flex items-center gap-2 text-foreground mb-3">
                    <Package className="h-4 w-4 text-primary" />
                    Items ({cart.items.length})
                  </h3>
                  <div className="space-y-3">
                    {cart.items.map((item, index) => {
                      const name = item.product?.name || item.nameSnapshot || 'Product';
                      const image =
                        item.product?.primaryImage?.secureUrl || item.imageSnapshot || '';
                      const price = item.priceSnapshot;

                      return (
                        <div key={index} className="flex items-center gap-4">
                          <img
                            src={image}
                            alt={name}
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium text-foreground">
                            £{(price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Place Order — £{total.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummaryCard items={cart?.items || []} subtotal={subtotal} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
