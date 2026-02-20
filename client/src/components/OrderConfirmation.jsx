import { Link } from 'react-router-dom';
import { CheckCircle, Package, Truck } from 'lucide-react';

const OrderConfirmation = ({ orderNumber }) => {
  return (
    <div className="min-h-screen py-12 bg-background text-foreground">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <div className="mx-auto w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-accent" />
        </div>

        <h1 className="text-3xl font-serif font-bold text-foreground mb-3">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-2">Thank you for your purchase</p>

        <span className="inline-block px-4 py-1 rounded-full text-base font-medium bg-muted text-muted-foreground mb-8">
          {orderNumber}
        </span>

        <div className="bg-card rounded-lg border border-border shadow-card p-6 space-y-4 text-left mb-8">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-medium text-foreground">Processing your order</p>
              <p className="text-sm text-muted-foreground">
                We'll send you an email confirmation shortly
              </p>
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-medium text-foreground">Estimated delivery</p>
              <p className="text-sm text-muted-foreground">3–7 business days</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/shop"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            to="/profile"
            className="px-6 py-3 border border-border text-foreground rounded-md font-medium hover:bg-muted transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
