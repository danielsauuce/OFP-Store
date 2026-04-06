import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Package, Truck, ShieldCheck, MapPin, CreditCard } from 'lucide-react';
import gsap from 'gsap';

const SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 15;

function OrderConfirmation({
  orderNumber,
  shippingAddress,
  items = [],
  subtotal = 0,
  paymentMethod = 'card',
}) {
  const pageRef = useRef(null);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  useLayoutEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.oc-icon', { scale: 0, duration: 0.6, ease: 'back.out(2)' })
        .fromTo(
          '.oc-ring',
          { scale: 1, opacity: 0.6 },
          { scale: 2.4, opacity: 0, duration: 0.9, ease: 'power2.out' },
          '-=0.4',
        )
        .from('.oc-heading', { y: 24, opacity: 0, duration: 0.6 }, '-=0.5')
        .from('.oc-sub', { y: 16, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('.oc-left', { x: -30, opacity: 0, duration: 0.6 }, '-=0.3')
        .from('.oc-right', { x: 30, opacity: 0, duration: 0.6 }, '-=0.5')
        .from('.oc-btn', { y: 16, opacity: 0, duration: 0.4, stagger: 0.1 }, '-=0.2');
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="oc-ring absolute h-20 w-20 rounded-full border-2 border-emerald-400" />
            <div className="oc-icon h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
          </div>
          <h1 className="oc-heading text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
            Thank you for your purchase!
          </h1>
          <p className="oc-sub text-muted-foreground max-w-md mx-auto text-sm">
            Your order will be processed within 24 hours during working days. We will notify you by
            email once your order has been shipped.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-muted rounded-full px-4 py-1.5">
            <span className="text-xs text-muted-foreground">Order</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {orderNumber}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left column — billing info + next steps */}
          <div className="oc-left lg:col-span-2 space-y-5">
            {/* Billing address */}
            {shippingAddress && (
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                  <MapPin className="h-4 w-4 text-primary" />
                  Billing address
                </h3>
                <dl className="space-y-1.5 text-sm">
                  {[
                    { label: 'Name', value: shippingAddress.fullName },
                    {
                      label: 'Address',
                      value: [
                        shippingAddress.street,
                        shippingAddress.city,
                        shippingAddress.state,
                        shippingAddress.postalCode,
                      ]
                        .filter(Boolean)
                        .join(', '),
                    },
                    { label: 'Phone', value: shippingAddress.phone },
                    { label: 'Email', value: shippingAddress.email },
                  ]
                    .filter((r) => r.value)
                    .map((row) => (
                      <div key={row.label} className="flex gap-3">
                        <dt className="w-16 shrink-0 text-muted-foreground font-medium">
                          {row.label}
                        </dt>
                        <dd className="text-foreground break-all">{row.value}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}

            {/* Payment method */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment method
              </h3>
              <p className="text-sm text-foreground">
                {paymentMethod === 'card' ? 'Credit / Debit Card' : 'Pay on Delivery'}
              </p>
            </div>

            {/* What happens next */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-foreground">What happens next</h3>
              {[
                {
                  icon: Package,
                  title: 'Processing your order',
                  desc: "We'll send you an email confirmation shortly",
                },
                {
                  icon: Truck,
                  title: 'Estimated delivery',
                  desc: '3–7 business days',
                },
                {
                  icon: ShieldCheck,
                  title: '2-year warranty included',
                  desc: 'All products come with manufacturer warranty',
                },
              ].map(({ icon: Icon, title, desc }, i, arr) => (
                <div key={title}>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                  {i !== arr.length - 1 && <div className="border-t border-border mt-4" />}
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-2.5">
              <Link
                to="/profile?tab=orders"
                className="oc-btn flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
              >
                <Package className="h-4 w-4" />
                Track Your Order
              </Link>
              <Link
                to="/shop"
                className="oc-btn flex items-center justify-center px-5 py-3 border border-border text-foreground rounded-xl font-medium text-sm hover:bg-muted transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Right column — order summary */}
          <div className="oc-right lg:col-span-3">
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {/* Receipt header */}
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="text-base font-semibold text-foreground">Order Summary</h2>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                  <span>
                    Order{' '}
                    <span className="font-medium text-foreground tabular-nums">{orderNumber}</span>
                  </span>
                  <span>
                    Date{' '}
                    <span className="font-medium text-foreground">
                      {new Date().toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </span>
                  <span>
                    Payment{' '}
                    <span className="font-medium text-foreground">
                      {paymentMethod === 'card' ? 'Card' : 'On Delivery'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-border">
                {items.map((item, idx) => {
                  const name = item.product?.name || item.nameSnapshot || 'Product';
                  const imgUrl =
                    item.product?.primaryImage?.secureUrl ||
                    item.product?.primaryImage?.url ||
                    item.imageSnapshot ||
                    null;
                  const price = item.priceSnapshot || 0;

                  return (
                    <div key={idx} className="flex items-center gap-4 px-6 py-4">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={name}
                          className="h-16 w-16 rounded-xl object-cover shrink-0 border border-border"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border">
                          <Package className="h-6 w-6 text-muted-foreground opacity-40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-foreground text-sm tabular-nums shrink-0">
                        £{(price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="px-6 py-4 border-t border-border space-y-2 bg-muted/20">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Sub Total</span>
                  <span className="tabular-nums">£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span className="tabular-nums">
                    {shipping === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                    ) : (
                      `£${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border">
                  <span>Order Total</span>
                  <span className="tabular-nums text-primary">£{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
