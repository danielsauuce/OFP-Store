import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TeamCTA = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        defaults: { ease: 'power3.out' },
      });

      tl.from('.team-title', {
        y: 50,
        opacity: 0,
        duration: 0.9,
      })
        .from(
          '.team-desc',
          {
            y: 30,
            opacity: 0,
            duration: 0.7,
          },
          '-=0.4',
        )
        .from(
          '.team-btn',
          {
            y: 25,
            opacity: 0,
            scale: 0.95,
            duration: 0.6,
            stagger: 0.12,
            ease: 'back.out(1.5)',
            clearProps: 'all',
          },
          '-=0.3',
        );

      // Button hover lift
      const buttons = gsap.utils.toArray('.team-btn');
      buttons.forEach((btn) => {
        const hoverTL = gsap.timeline({ paused: true });
        hoverTL.to(btn, {
          y: -3,
          scale: 1.04,
          boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
          duration: 0.25,
          ease: 'power2.out',
        });
        btn.addEventListener('mouseenter', () => hoverTL.play());
        btn.addEventListener('mouseleave', () => hoverTL.reverse());
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="bg-muted/30 rounded-2xl p-12 text-center">
      <h2 className="team-title text-3xl md:text-4xl font-serif font-bold mb-4 text-foreground">
        Meet Our Team
      </h2>

      <p className="team-desc text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
        Our passionate designers, craftsmen, and support team work together to bring you the finest
        furniture & premium shopping experience.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link to="/shop">
          <button className="team-btn px-7 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-dark transition-colors font-medium">
            Browse Collection
          </button>
        </Link>

        <Link to="/contact">
          <button className="team-btn px-7 py-3 border border-border rounded-xl hover:bg-muted transition-colors font-medium text-foreground">
            Contact Us
          </button>
        </Link>
      </div>
    </div>
  );
};

export default TeamCTA;
