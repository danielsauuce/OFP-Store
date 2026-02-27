import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const HeaderContact = () => {
  const headerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      tl.from('.contact-title', {
        y: 60,
        opacity: 0,
        duration: 1,
      })
        .fromTo(
          '.contact-header-line',
          { scaleX: 0 },
          { scaleX: 1, duration: 0.7, ease: 'power2.inOut', transformOrigin: 'center' },
          '-=0.4',
        )
        .from(
          '.contact-subtitle',
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
          },
          '-=0.3',
        );
    }, headerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={headerRef} className="text-center mb-12">
      <h1 className="contact-title text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
        Get in Touch
      </h1>
      <div className="contact-header-line h-[3px] w-16 bg-primary mx-auto mb-5 rounded-full" />
      <p className="contact-subtitle text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as
        possible.
      </p>
    </div>
  );
};

export default HeaderContact;
