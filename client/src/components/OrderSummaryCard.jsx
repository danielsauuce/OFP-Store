import { ShieldCheck, Truck } from 'lucide-react';
import { SHIPPING_THRESHOLD, SHIPPING_COST } from '../lib/shippingConstants';

const OrderSummaryCard = ({ items, subtotal }) => {
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  return (
    <div className="bg-card rounded-lg border border-border shadow-card p-6 space-y-4 sticky top-20">
      <h3 className="text-lg font-semibold text-foreground">Order Summary</h3>

      <div className="border-t border-border" />

      {/* Item List */}
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-muted-foreground truncate mr-2">
              {item.nameSnapshot || item.name} × {item.quantity}
            </span>
            <span className="font-medium text-foreground whitespace-nowrap">
              ₦
              {((item.priceSnapshot || item.price) * item.quantity).toLocaleString('en-NG', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-border" />

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>
            ₦
            {subtotal.toLocaleString('en-NG', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>
            {shipping === 0 ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent">
                Free
              </span>
            ) : (
              `₦${shipping.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </span>
        </div>

        <div className="border-t border-border" />

        <div className="flex justify-between text-lg font-bold text-foreground pt-1">
          <span>Total</span>
          <span>
            ₦{total.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="pt-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          <span>Secure checkout</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Truck className="h-3.5 w-3.5 text-accent" />
          <span>Free shipping on orders ₦50,000 or more</span>
        </div>
      </div>
    </div>
  );
};

export { SHIPPING_THRESHOLD, SHIPPING_COST };
export default OrderSummaryCard;
