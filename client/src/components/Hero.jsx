import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1800&auto=format&fit=crop&q=80';

function Hero() {
  const heroRef = useRef(null);
  const imageRef = useRef(null);
  const overlayRef = useRef(null);
  const buttonRef = useRef(null);

  useLayoutEffect(() => {
    if (window.Cypress) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      tl.fromTo(
        imageRef.current,
        { scale: 1.12, filter: 'brightness(0.3) blur(8px)' },
        { scale: 1.05, filter: 'brightness(0.55) blur(0px)', duration: 2 },
      )
        .from('.hero-tag', { y: 20, opacity: 0, duration: 0.6 }, '-=1')
        .from('.hero-title', { y: 60, opacity: 0, duration: 1, ease: 'power3.out' }, '-=0.6')
        .from('.hero-line', { scaleX: 0, transformOrigin: 'center', duration: 0.7 }, '-=0.4')
        .from('.hero-sub', { y: 30, opacity: 0, duration: 0.8 }, '-=0.4')
        .from(
          buttonRef.current,
          {
            y: 30,
            opacity: 0,
            scale: 0.9,
            duration: 0.7,
            ease: 'back.out(1.5)',
            clearProps: 'all',
          },
          '-=0.3',
        );

      // Parallax on scroll
      gsap.to(imageRef.current, {
        y: 80,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
      });

      gsap.to('.hero-content', {
        y: -50,
        opacity: 0.2,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '70% top',
          scrub: 1,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-[680px] md:h-[90vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          ref={imageRef}
          src={HERO_IMAGE}
          alt="Luxury furniture showroom"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Gradient overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"
      />

      {/* Content */}
      <div className="hero-content relative z-20 container mx-auto px-4 text-center">
        <span className="hero-tag inline-block text-xs uppercase tracking-[0.3em] text-white/70 font-medium mb-4">
          Premium Furniture Collection
        </span>

        <h1 className="hero-title text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-white leading-tight mb-5 max-w-3xl mx-auto">
          Find The Perfect Furniture To Complete Your Home
        </h1>

        <div className="hero-line h-[2px] w-20 bg-primary mx-auto mb-6 rounded-full" />

        <p className="hero-sub text-base md:text-lg text-white/75 max-w-xl mx-auto mb-10 leading-relaxed">
          Carefully curated pieces based on excellent aesthetic and exceptional craftsmanship
        </p>

        <Link
          ref={buttonRef}
          to="/shop"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl text-base font-semibold shadow-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Shop Now
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export default Hero;
