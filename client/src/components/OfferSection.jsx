import { useLayoutEffect, useRef } from 'react';
import { PackageCheck, Truck, RefreshCw } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SHIPPING_THRESHOLD } from '../lib/shippingConstants';

gsap.registerPlugin(ScrollTrigger);

const OFFERS = [
  {
    icon: PackageCheck,
    title: 'Made Your Order',
    description: 'All process made in order for you',
  },
  {
    icon: Truck,
    title: 'Free Delivery',
    description: `Free delivery for order worth £${SHIPPING_THRESHOLD}`,
  },
  {
    icon: RefreshCw,
    title: 'Free Exchange',
    description: 'Free exchange on all our products',
  },
];

function OfferCard({ icon: Icon, title, description }) {
  return (
    <div className="offer-card flex flex-col items-center text-center p-8">
      <div className="mb-5 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="font-serif font-semibold text-lg text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

const OfferSection = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    if (window.Cypress) return;
    const ctx = gsap.context(() => {
      gsap.from('.offer-header', {
        scrollTrigger: {
          trigger: '.offer-header',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
      gsap.from('.offer-card', {
        scrollTrigger: {
          trigger: '.offer-grid',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="offer-header text-center mb-10">
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            What We Can Offer You
          </h2>
          <div className="h-[2px] w-14 bg-primary mx-auto mb-4 rounded-full" />
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            High quality, stylish and functional furniture designed to elevate your space with
            comfort and elegance
          </p>
        </div>

        <div className="offer-grid grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
          {OFFERS.map((offer) => (
            <OfferCard key={offer.title} {...offer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default OfferSection;
