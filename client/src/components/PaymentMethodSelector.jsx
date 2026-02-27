import { CreditCard, Banknote } from 'lucide-react';

const paymentOptions = [
  {
    value: 'card',
    label: 'Credit / Debit Card',
    description: 'Pay securely with your card',
    icon: CreditCard,
    iconColor: 'text-primary',
  },
  {
    value: 'pay_on_delivery',
    label: 'Pay on Delivery',
    description: 'Cash or card on delivery',
    icon: Banknote,
    iconColor: 'text-accent',
  },
];

const PaymentMethodSelector = ({ selected, onChange }) => {
  return (
    <div className="space-y-3">
      {paymentOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = selected === option.value;

        return (
          <label
            key={option.value}
            htmlFor={`payment-${option.value}`}
            className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            <input
              type="radio"
              id={`payment-${option.value}`}
              name="paymentMethod"
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="accent-primary h-4 w-4"
            />
            <Icon className={`h-5 w-5 ${option.iconColor}`} />
            <div className="flex-1">
              <p className="font-medium text-foreground">{option.label}</p>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
};

export default PaymentMethodSelector;
