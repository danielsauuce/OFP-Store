import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const AboutCard = () => {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const imageWrapperRef = useRef(null);

  useLayoutEffect(() => {
    let btnEnter;
    let btnLeave;
    let btnEl;

    const ctx = gsap.context(() => {
      // Main entrance timeline, scroll-triggered
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
        defaults: { ease: 'power4.out' },
      });

      // Text lines stagger from left with clip-path reveal
      tl.from('.about-heading', {
        x: -80,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      })
        .from(
          '.about-para',
          {
            x: -60,
            opacity: 0,
            duration: 0.9,
            stagger: 0.2,
            ease: 'power3.out',
          },
          '-=0.6',
        )
        .from(
          '.about-button',
          {
            y: 30,
            opacity: 0,
            scale: 0.9,
            duration: 0.8,
            ease: 'back.out(1.7)',
            clearProps: 'all',
          },
          '-=0.4',
        );

      // Image wrapper slides in from right with mask reveal
      tl.fromTo(
        imageWrapperRef.current,
        {
          clipPath: 'inset(0 100% 0 0)',
          x: 60,
        },
        {
          clipPath: 'inset(0 0% 0 0)',
          x: 0,
          duration: 1.3,
          ease: 'power3.inOut',
        },
        '-=1.6',
      );

      // Image Ken Burns settle
      tl.fromTo(
        imageRef.current,
        { scale: 1.25 },
        { scale: 1, duration: 2, ease: 'power2.out' },
        '-=1.3',
      );

      // Parallax on scroll for the image
      gsap.to(imageRef.current, {
        y: -40,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2,
        },
      });

      // Decorative accent line animation
      gsap.fromTo(
        '.about-accent-line',
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: 1,
          duration: 1,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: '.about-accent-line',
            start: 'top 85%',
          },
        },
      );

      // Button hover — store references for cleanup
      btnEl = sectionRef.current.querySelector('.about-button');
      if (btnEl) {
        const hoverTL = gsap.timeline({ paused: true });
        hoverTL.to(btnEl, {
          scale: 1.05,
          boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
          duration: 0.3,
          ease: 'power2.out',
        });
        btnEnter = () => hoverTL.play();
        btnLeave = () => hoverTL.reverse();
        btnEl.addEventListener('mouseenter', btnEnter);
        btnEl.addEventListener('mouseleave', btnLeave);
      }
    }, sectionRef);

    return () => {
      // Clean up manually added event listeners
      if (btnEl && btnEnter && btnLeave) {
        btnEl.removeEventListener('mouseenter', btnEnter);
        btnEl.removeEventListener('mouseleave', btnLeave);
      }
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left Text */}
          <div>
            <h2 className="about-heading text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground leading-tight">
              Craftsmanship that Lasts Generations
            </h2>

            <div className="about-accent-line h-[3px] w-20 bg-primary mb-8 rounded-full" />

            <p className="about-para text-muted-foreground mb-6 leading-relaxed text-lg">
              Since 1995, Olayinka Furniture Palace has been dedicated to crafting exceptional
              furniture pieces that stand the test of time.
            </p>

            <p className="about-para text-muted-foreground mb-10 leading-relaxed text-lg">
              Every piece is created from premium materials, ensuring durability, comfort, and
              elegance for homes that value quality.
            </p>

            <Link to="/about">
              <button className="about-button px-8 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark transition-colors text-lg font-medium shadow-lg">
                Learn More About Us
              </button>
            </Link>
          </div>

          {/* Right Image with clip-path reveal */}
          <div
            ref={imageWrapperRef}
            className="relative h-[450px] rounded-2xl overflow-hidden shadow-2xl bg-card"
          >
            <img
              ref={imageRef}
              src="https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80"
              alt="Furniture craftsmanship"
              className="w-full h-full object-cover"
            />
            {/* Subtle overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutCard;
