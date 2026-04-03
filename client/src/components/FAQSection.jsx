import { useState, useLayoutEffect, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';
import { FAQ_ITEMS } from '../data/FAQData';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function FAQItem({ item, open, onToggle }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground leading-snug">{item.question}</span>
        <span className="shrink-0 mt-0.5">
          {open ? (
            <Minus className="h-4 w-4 text-primary" />
          ) : (
            <Plus className="h-4 w-4 text-muted-foreground" />
          )}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

const FAQSection = () => {
  const [openId, setOpenId] = useState(null);
  const sectionRef = useRef(null);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  // Split into two columns
  const half = Math.ceil(FAQ_ITEMS.length / 2);
  const leftCol = FAQ_ITEMS.slice(0, half);
  const rightCol = FAQ_ITEMS.slice(half);

  useLayoutEffect(() => {
    if (window.Cypress) return;
    const ctx = gsap.context(() => {
      gsap.from('.faq-header', {
        scrollTrigger: {
          trigger: '.faq-header',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
      gsap.from('.faq-col', {
        scrollTrigger: {
          trigger: '.faq-grid',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 50,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power3.out',
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="faq-header text-center mb-12">
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3">
            Support
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            You&apos;ve Got Questions &amp; We&apos;ve Got Answers!
          </h2>
          <div className="h-[2px] w-14 bg-primary mx-auto mb-4 rounded-full" />
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Still have questions? Feel free to{' '}
            <Link to="/contact" className="text-primary underline underline-offset-2">
              contact us
            </Link>
            .
          </p>
        </div>

        <div className="faq-grid grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
          <div className="faq-col space-y-3">
            {leftCol.map((item) => (
              <FAQItem
                key={item.id}
                item={item}
                open={openId === item.id}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </div>
          <div className="faq-col space-y-3">
            {rightCol.map((item) => (
              <FAQItem
                key={item.id}
                item={item}
                open={openId === item.id}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
