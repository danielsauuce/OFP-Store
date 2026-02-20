import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

const AboutCard = () => {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      });

      // Text slides in from left
      tl.from('.about-text', {
        x: -100,
        opacity: 0,
        duration: 1.2,
      })

        // Image slides in from right
        .from(
          '.about-image',
          {
            x: 100,
            opacity: 0,
            duration: 1.2,
          },
          '-=1',
        )

        // Button fade up
        .from(
          '.about-button',
          {
            y: 40,
            opacity: 0,
            duration: 0.8,
          },
          '-=0.6',
        );

      // Subtle image settle effect
      gsap.fromTo(
        imageRef.current,
        { scale: 1.1 },
        { scale: 1, duration: 1.5, ease: 'power3.out' },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Text */}
          <div className="about-text">
            <h2 className="text-4xl font-serif font-bold mb-6 text-foreground">
              Craftsmanship that Lasts Generations
            </h2>

            <p className="text-muted-foreground mb-6 leading-relaxed">
              Since 1995, Olayinka Furniture Palace has been dedicated to crafting exceptional
              furniture pieces that stand the test of time.
            </p>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              Every piece is created from premium materials, ensuring durability, comfort, and
              elegance for homes that value quality.
            </p>

            <Link to="/about">
              <button className="about-button px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary-light">
                Learn More About Us
              </button>
            </Link>
          </div>

          {/* Right Image */}
          <div className="about-image relative h-[400px] rounded-lg overflow-hidden shadow-lg bg-card">
            <img
              ref={imageRef}
              src="https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80"
              alt="Furniture craftsmanship"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutCard;
