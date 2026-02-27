import { useLayoutEffect, useRef } from 'react';
import { values } from '../data/Value';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ValuesSection = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Section title entrance
      gsap.from('.values-title', {
        scrollTrigger: {
          trigger: '.values-title',
          start: 'top 85%',
        },
        y: 50,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      });

      // Value cards stagger
      const cards = gsap.utils.toArray('.value-card');
      cards.forEach((card, i) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        });

        // Card slides up
        tl.from(card, {
          y: 70,
          opacity: 0,
          scale: 0.92,
          duration: 0.8,
          delay: i * 0.1,
          ease: 'power3.out',
          clearProps: 'transform',
        });

        // Icon spins in
        const icon = card.querySelector('.value-icon');
        if (icon) {
          tl.from(
            icon,
            {
              scale: 0,
              rotation: -180,
              duration: 0.6,
              ease: 'back.out(2)',
            },
            '-=0.4',
          );
        }
      });

      // Card hover lift
      cards.forEach((card) => {
        const hoverTL = gsap.timeline({ paused: true });
        hoverTL.to(card, {
          y: -6,
          boxShadow: '0 16px 40px rgba(0,0,0,0.1)',
          duration: 0.3,
          ease: 'power2.out',
        });
        card.addEventListener('mouseenter', () => hoverTL.play());
        card.addEventListener('mouseleave', () => hoverTL.reverse());
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="mb-20">
      <h2 className="values-title text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
        Our Values
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {values.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="value-card text-center p-6 bg-card rounded-xl shadow-card cursor-default"
            >
              <div className="value-icon inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Icon className="h-8 w-8 text-primary" />
              </div>

              <h3 className="font-semibold text-lg mb-2 text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ValuesSection;
