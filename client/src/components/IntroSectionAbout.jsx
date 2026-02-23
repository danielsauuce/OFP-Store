import { useLayoutEffect, useRef } from 'react';
import { aboutImage } from '../data/Value';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const IntroSection = () => {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Text content staggers in from left
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
        defaults: { ease: 'power3.out' },
      });

      tl.from('.intro-heading', {
        x: -70,
        opacity: 0,
        duration: 1,
      }).from(
        '.intro-para',
        {
          x: -50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
        },
        '-=0.5',
      );

      // Image reveal with clip-path wipe from right
      gsap.fromTo(
        '.intro-image-wrapper',
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 1.2,
          ease: 'power3.inOut',
          scrollTrigger: {
            trigger: '.intro-image-wrapper',
            start: 'top 78%',
            toggleActions: 'play none none none',
          },
        },
      );

      // Ken Burns settle on the image
      gsap.fromTo(
        imageRef.current,
        { scale: 1.15 },
        {
          scale: 1,
          duration: 2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.intro-image-wrapper',
            start: 'top 78%',
            toggleActions: 'play none none none',
          },
        },
      );

      // Parallax on scroll
      gsap.to(imageRef.current, {
        y: -30,
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
    <div ref={sectionRef} className="grid md:grid-cols-2 gap-12 items-center mb-20">
      <div className="space-y-6">
        <h2 className="intro-heading text-3xl md:text-4xl font-serif font-bold text-foreground">
          A Legacy of Excellence
        </h2>

        <p className="intro-para text-muted-foreground leading-relaxed">
          Olayinka Furniture Palace was founded in 1995 with a simple mission: to create beautiful,
          durable furniture that stands the test of time...
        </p>

        <p className="intro-para text-muted-foreground leading-relaxed">
          Our founder, Chief Olayinka, believed that furniture should be more than functional...
        </p>

        <p className="intro-para text-muted-foreground leading-relaxed">
          Every piece we create combines craftsmanship, modern design, and premium materials...
        </p>
      </div>

      <div className="intro-image-wrapper relative h-[500px] rounded-2xl overflow-hidden shadow-xl">
        <img
          ref={imageRef}
          src={aboutImage}
          alt="Furniture workshop"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
      </div>
    </div>
  );
};

export default IntroSection;
