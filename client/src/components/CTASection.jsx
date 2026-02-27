import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CTASection = () => {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);

  useLayoutEffect(() => {
    const buttonHandlers = [];

    const ctx = gsap.context(() => {
      // Entrance timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        defaults: { ease: 'power4.out' },
      });

      // Heading words stagger
      const words = sectionRef.current.querySelectorAll('.cta-word');
      tl.from(words, {
        y: 60,
        opacity: 0,
        rotateX: -30,
        duration: 0.9,
        stagger: 0.06,
        ease: 'back.out(1.3)',
      });

      // Description fade up
      tl.from(
        '.cta-description',
        {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
        },
        '-=0.5',
      );

      // Divider expand
      tl.fromTo(
        '.cta-divider',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.6,
          ease: 'power2.inOut',
          transformOrigin: 'center center',
        },
        '-=0.4',
      );

      // Buttons entrance — stagger from below with slight bounce
      tl.from(
        '.cta-button',
        {
          y: 40,
          opacity: 0,
          scale: 0.9,
          duration: 0.7,
          stagger: 0.15,
          ease: 'back.out(1.5)',
          clearProps: 'all',
        },
        '-=0.3',
      );

      // Animated gradient background shift
      gsap.to(bgRef.current, {
        backgroundPosition: '200% center',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 3,
        },
      });

      // Button hover effects — store references for cleanup
      const buttons = gsap.utils.toArray('.cta-button');
      buttons.forEach((btn) => {
        const hoverTL = gsap.timeline({ paused: true });
        hoverTL.to(btn, {
          scale: 1.06,
          y: -3,
          boxShadow: '0 15px 40px rgba(0,0,0,0.25)',
          duration: 0.3,
          ease: 'power2.out',
        });

        const onEnter = () => hoverTL.play();
        const onLeave = () => hoverTL.reverse();
        btn.addEventListener('mouseenter', onEnter);
        btn.addEventListener('mouseleave', onLeave);
        buttonHandlers.push({ btn, onEnter, onLeave });
      });
    }, sectionRef);

    return () => {
      // Clean up manually added event listeners
      buttonHandlers.forEach(({ btn, onEnter, onLeave }) => {
        btn.removeEventListener('mouseenter', onEnter);
        btn.removeEventListener('mouseleave', onLeave);
      });
      ctx.revert();
    };
  }, []);

  // Split heading into words for stagger
  const headingText = 'Ready to Transform Your Space?';
  const headingWords = headingText.split(' ').map((word, i) => (
    <span key={i} className="cta-word inline-block mr-[0.3em]" style={{ perspective: '600px' }}>
      {word}
    </span>
  ));

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden">
      {/* Animated gradient background */}
      <div
        ref={bgRef}
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 40%, hsl(var(--primary)) 70%, hsl(var(--primary-light)) 100%)',
          backgroundSize: '300% 100%',
        }}
      />

      <div className="relative container mx-auto px-4 text-center z-10">
        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-primary-foreground leading-tight">
          {headingWords}
        </h2>

        {/* Divider */}
        <div className="cta-divider h-[2px] w-20 bg-primary-foreground/40 mx-auto mb-6 rounded-full" />

        {/* Description */}
        <p className="cta-description text-lg mb-10 text-primary-foreground/90 max-w-2xl mx-auto">
          Visit our showroom or browse our online collection to find the perfect pieces for your
          home.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <Link to="/shop">
            <button className="cta-button px-8 py-4 rounded-xl border-2 border-primary-foreground bg-primary-foreground text-primary font-semibold text-lg shadow-lg transition-colors hover:bg-transparent hover:text-primary-foreground">
              Browse Collection
            </button>
          </Link>

          <Link to="/contact">
            <button className="cta-button px-8 py-4 rounded-xl border-2 border-primary-foreground bg-transparent text-primary-foreground font-semibold text-lg shadow-lg transition-colors hover:bg-primary-foreground hover:text-primary">
              Contact Us
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
