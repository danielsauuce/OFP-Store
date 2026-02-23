import { useLayoutEffect, useRef } from 'react';
import { contactInfo } from '../data/Contactinfo';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ContactInfoCards = () => {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.info-card');

      // Cards stagger entrance from right
      cards.forEach((card, i) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        });

        tl.from(card, {
          x: 60,
          opacity: 0,
          duration: 0.7,
          delay: i * 0.1,
          ease: 'power3.out',
          clearProps: 'transform',
        });

        // Icon pops in
        const icon = card.querySelector('.info-icon');
        if (icon) {
          tl.from(
            icon,
            {
              scale: 0,
              rotation: -90,
              duration: 0.5,
              ease: 'back.out(2)',
            },
            '-=0.3',
          );
        }
      });

      // Hover lift for each card
      cards.forEach((card) => {
        const hoverTL = gsap.timeline({ paused: true });
        hoverTL.to(card, {
          y: -5,
          boxShadow: '0 14px 35px rgba(0,0,0,0.1)',
          duration: 0.3,
          ease: 'power2.out',
        });
        card.addEventListener('mouseenter', () => hoverTL.play());
        card.addEventListener('mouseleave', () => hoverTL.reverse());
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {contactInfo.map((info, index) => {
        const Icon = info.icon;
        return (
          <div
            key={index}
            className="info-card bg-card p-6 rounded-xl shadow-card flex items-start gap-4 border border-border/50 cursor-default"
          >
            <div className="info-icon w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1 text-foreground">{info.title}</h3>
              {info.link !== '#' ? (
                <a
                  href={info.link}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {info.details}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">{info.details}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContactInfoCards;
