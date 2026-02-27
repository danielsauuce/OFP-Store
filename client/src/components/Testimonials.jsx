import { Star } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { testimonials } from '../data/Testimonials';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Testimonials = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const hoverHandlers = [];

    const ctx = gsap.context(() => {
      // Section header entrance
      const headerTL = gsap.timeline({
        scrollTrigger: {
          trigger: '.testimonials-header',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });

      headerTL
        .from('.testimonials-title', {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'power4.out',
        })
        .from(
          '.testimonials-subtitle',
          {
            y: 30,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
          },
          '-=0.5',
        )
        .fromTo(
          '.testimonials-divider',
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.6,
            ease: 'power2.inOut',
            transformOrigin: 'center center',
          },
          '-=0.3',
        );

      // Cards cascade entrance with stagger
      const cards = gsap.utils.toArray('.testimonial-card');
      cards.forEach((card, i) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        });

        // Card entrance — cascade from bottom with slight rotation
        tl.from(card, {
          y: 80,
          opacity: 0,
          rotateX: 8,
          scale: 0.95,
          duration: 0.9,
          delay: i * 0.15,
          ease: 'power3.out',
          clearProps: 'transform',
        });

        // Stars stagger within each card
        const stars = card.querySelectorAll('.testimonial-star');
        tl.from(
          stars,
          {
            scale: 0,
            opacity: 0,
            rotation: -180,
            duration: 0.4,
            stagger: 0.08,
            ease: 'back.out(2)',
          },
          '-=0.4',
        );

        // Quote text fade in
        tl.from(
          card.querySelector('.testimonial-quote'),
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.3',
        );

        // Author info slide in
        tl.from(
          card.querySelector('.testimonial-author'),
          {
            x: -30,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
          },
          '-=0.2',
        );
      });

      // Card hover lift effect — store references for cleanup
      cards.forEach((card) => {
        const hoverTL = gsap.timeline({ paused: true });
        hoverTL.to(card, {
          y: -8,
          boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
          duration: 0.35,
          ease: 'power2.out',
        });

        const onEnter = () => hoverTL.play();
        const onLeave = () => hoverTL.reverse();
        card.addEventListener('mouseenter', onEnter);
        card.addEventListener('mouseleave', onLeave);
        hoverHandlers.push({ card, onEnter, onLeave });
      });
    }, sectionRef);

    return () => {
      // Clean up manually added event listeners
      hoverHandlers.forEach(({ card, onEnter, onLeave }) => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mouseleave', onLeave);
      });
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-muted overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="testimonials-header text-center mb-14">
          <h2 className="testimonials-title text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
            What Our Customers Say
          </h2>
          <div className="testimonials-divider h-[3px] w-16 bg-primary mx-auto mb-4 rounded-full" />
          <p className="testimonials-subtitle text-muted-foreground text-lg">
            Don't just take our word for it
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="testimonial-card bg-card p-8 rounded-2xl shadow-md border border-border/50 cursor-default"
              style={{ perspective: '800px' }}
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-5">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} className="testimonial-star w-5 h-5 fill-gold text-gold" />
                ))}
              </div>

              {/* Quote */}
              <p className="testimonial-quote text-muted-foreground italic mb-6 leading-relaxed text-[15px]">
                &ldquo;{item.comment}&rdquo;
              </p>

              {/* Author */}
              <div className="testimonial-author flex items-center gap-4 pt-4 border-t border-border/50">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">{item.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
