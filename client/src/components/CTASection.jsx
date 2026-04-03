import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CTA_IMAGE =
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1800&auto=format&fit=crop&q=80';

const CTASection = () => {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);

  useLayoutEffect(() => {
    if (window.Cypress) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        defaults: { ease: 'power3.out' },
      });

      tl.from('.cta-tag', { y: 20, opacity: 0, duration: 0.6 })
        .from('.cta-title', { y: 50, opacity: 0, duration: 0.9 }, '-=0.3')
        .from('.cta-line', { scaleX: 0, transformOrigin: 'center', duration: 0.6 }, '-=0.4')
        .from(
          '.cta-btn',
          {
            y: 30,
            opacity: 0,
            scale: 0.9,
            duration: 0.7,
            ease: 'back.out(1.4)',
            clearProps: 'all',
          },
          '-=0.3',
        );

      // Subtle parallax on the background image
      gsap.to(imageRef.current, {
        y: 60,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-28 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          ref={imageRef}
          src={CTA_IMAGE}
          alt="Luxury interior"
          className="w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <span className="cta-tag inline-block text-xs uppercase tracking-[0.3em] text-white/60 font-medium mb-4">
          Transform Your Space
        </span>

        <h2 className="cta-title text-3xl md:text-5xl font-serif font-bold text-white leading-tight mb-5 max-w-2xl mx-auto">
          Build Your Home With A Comfortable Room By Using Our Interior
        </h2>

        <div className="cta-line h-[2px] w-16 bg-primary mx-auto mb-8 rounded-full" />

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/shop"
            className="cta-btn inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            Shop Now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            className="cta-btn inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-white/50 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
