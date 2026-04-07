import { Star } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { testimonials } from '../data/Testimonials';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Product images shown inside testimonial cards
const PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=70',
  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&q=70',
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&q=70',
];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ item, productImage }) {
  return (
    <div className="testimonial-card bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-default">
      {/* Product image */}
      <div className="relative h-44 overflow-hidden bg-muted">
        <img src={productImage} alt="Product" className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Rating + name row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-semibold text-foreground text-sm">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.role}</p>
          </div>
          <StarRating rating={item.rating} />
        </div>

        {/* Quote */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          &ldquo;{item.comment}&rdquo;
        </p>
      </div>
    </div>
  );
}

const Testimonials = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    if (window.Cypress) return;
    const ctx = gsap.context(() => {
      gsap.from('.testimonials-header', {
        scrollTrigger: {
          trigger: '.testimonials-header',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
      gsap.from('.testimonial-card', {
        scrollTrigger: {
          trigger: '.testimonials-grid',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power3.out',
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="testimonials-header text-center mb-12">
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3">
            Reviews
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Word From Our Happy Customers
          </h2>
          <div className="h-[2px] w-14 bg-primary mx-auto mb-4 rounded-full" />
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Hear from our clients to see how our furniture brings their visions to life
          </p>
        </div>

        <div className="testimonials-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <TestimonialCard
              key={item.id}
              item={item}
              productImage={PRODUCT_IMAGES[i % PRODUCT_IMAGES.length]}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
