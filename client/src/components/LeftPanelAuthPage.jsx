import { useLayoutEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import gsap from 'gsap';

const stats = [
  { value: 500, suffix: '+', label: 'Unique Pieces' },
  { value: 15, suffix: '+', label: 'Years Experience' },
  { value: 10, suffix: 'k+', label: 'Happy Customers' },
];

const LeftPanelAuthPage = () => {
  const panelRef = useRef(null);
  const bgRef = useRef(null);
  const numberRefs = useRef([]);

  const imgUrl = 'https://i.pinimg.com/1200x/de/8e/6c/de8e6cee6fb469054b917257e5149662.jpg';

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const master = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Background image
      master.fromTo(
        bgRef.current,
        { scale: 1.2, filter: 'brightness(0.4) blur(6px)' },
        { scale: 1, filter: 'brightness(1) blur(0px)', duration: 2 },
      );

      // Gradient overlay fades in
      master.from('.auth-overlay', { opacity: 0, duration: 1.2 }, '-=1.5');

      // Decorative circles float in with stagger
      master.from(
        '.auth-circle',
        {
          scale: 0,
          opacity: 0,
          duration: 1,
          stagger: 0.2,
          ease: 'back.out(1.5)',
        },
        '-=1',
      );

      // Logo entrance
      master
        .from(
          '.auth-logo-icon',
          {
            rotate: -180,
            scale: 0,
            duration: 0.6,
            ease: 'back.out(2)',
          },
          '-=0.6',
        )
        .from('.auth-logo-text', { x: -30, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('.auth-logo-sub', { y: 10, opacity: 0, duration: 0.4 }, '-=0.2');

      // Heading
      master.from(
        '.auth-heading-line',
        {
          y: 60,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power4.out',
        },
        '-=0.3',
      );

      // Description
      master.from('.auth-description', { y: 30, opacity: 0, duration: 0.7 }, '-=0.4');

      // Stats blocks stagger
      master.from(
        '.auth-stat',
        {
          y: 40,
          opacity: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: 'back.out(1.3)',
        },
        '-=0.3',
      );

      // Animated number counting for stats
      numberRefs.current.forEach((el, i) => {
        if (!el) return;
        const target = { val: 0 };
        gsap.to(target, {
          val: stats[i].value,
          duration: 1.8,
          delay: 1.2 + i * 0.15,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = Math.floor(target.val) + stats[i].suffix;
          },
        });
      });

      // Floating circle continuous animation
      const circles = gsap.utils.toArray('.auth-circle');
      circles.forEach((c, i) => {
        gsap.to(c, {
          y: gsap.utils.random(-15, 15),
          x: gsap.utils.random(-10, 10),
          duration: gsap.utils.random(3, 5),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.5,
        });
      });
    }, panelRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={panelRef} className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      {/* Background Image */}
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imgUrl})` }}
      />

      {/* Gradient Overlay */}
      <div className="auth-overlay absolute inset-0 bg-gradient-to-br from-primary/50 via-primary/30 to-primary-dark/40" />

      {/* Decorative Circles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="auth-circle absolute top-20 left-10 w-32 h-32 border-2 border-gold/30 rounded-full" />
        <div className="auth-circle absolute bottom-40 right-20 w-24 h-24 border border-gold/20 rounded-full" />
        <div className="auth-circle absolute top-1/2 left-1/4 w-16 h-16 bg-gold/10 rounded-full blur-xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground w-full">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="auth-logo-icon h-7 w-7 text-gold" />
            <span className="auth-logo-text text-2xl font-serif font-bold">Olayinka</span>
          </div>
          <p className="auth-logo-sub text-primary-foreground/80 text-sm tracking-widest uppercase">
            Furniture Palace
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <h1 className="text-5xl font-serif font-bold leading-tight">
            <span className="auth-heading-line block">Craft Your</span>
            <span className="auth-heading-line block text-gold">Perfect Space</span>
          </h1>

          <p className="auth-description text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            Experience luxury furniture that transforms houses into homes. Each piece tells a story
            of craftsmanship and elegance.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pt-6">
            {stats.map((stat, index) => (
              <div key={index} className="auth-stat text-center">
                <p
                  ref={(el) => (numberRefs.current[index] = el)}
                  className="text-3xl font-bold text-gold"
                >
                  0{stat.suffix}
                </p>
                <p className="text-sm text-primary-foreground/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div />
      </div>
    </div>
  );
};

export default LeftPanelAuthPage;
