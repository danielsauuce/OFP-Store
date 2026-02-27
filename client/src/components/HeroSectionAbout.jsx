import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power4.out' },
      });

      // Title characters split entrance
      tl.from('.about-hero-title', {
        y: 60,
        opacity: 0,
        duration: 1,
      }).from(
        '.about-hero-subtitle',
        {
          y: 30,
          opacity: 0,
          duration: 0.8,
        },
        '-=0.5',
      );

      // Decorative line expand
      tl.fromTo(
        '.about-hero-line',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.7, ease: 'power2.inOut', transformOrigin: 'center' },
        '-=0.4',
      );

      // Subtle parallax on the background
      gsap.to(sectionRef.current, {
        backgroundPositionY: '30%',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 2,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 bg-primary/10 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="about-hero-title text-5xl md:text-6xl font-serif font-bold mb-4 text-foreground">
            Our Story
          </h1>
          <div className="about-hero-line h-[3px] w-16 bg-primary mx-auto mb-6 rounded-full" />
          <p className="about-hero-subtitle text-xl text-muted-foreground leading-relaxed">
            Since 1995, we've been crafting furniture that transforms houses into homes
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
