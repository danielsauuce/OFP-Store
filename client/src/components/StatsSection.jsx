import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: 28, suffix: '+', label: 'Years in Business' },
  { value: 5000, suffix: '+', label: 'Happy Customers' },
  { value: 200, suffix: '+', label: 'Furniture Pieces' },
  { value: 50, suffix: '+', label: 'Expert Craftsmen' },
];

const StatsSection = () => {
  const sectionRef = useRef(null);
  const numberRefs = useRef([]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Stat blocks stagger entrance
      const blocks = gsap.utils.toArray('.stat-block');
      gsap.from(blocks, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
      });

      // Animated number counting
      numberRefs.current.forEach((el, i) => {
        if (!el) return;
        const target = { val: 0 };

        gsap.to(target, {
          val: stats[i].value,
          duration: 2,
          delay: i * 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          onUpdate: () => {
            el.textContent = Math.floor(target.val).toLocaleString() + stats[i].suffix;
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((item, index) => (
            <div key={index} className="stat-block">
              <p
                ref={(el) => (numberRefs.current[index] = el)}
                className="text-5xl md:text-6xl font-bold mb-2"
              >
                0{item.suffix}
              </p>
              <p className="text-sm opacity-80">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
