import { useLayoutEffect, useRef, useCallback } from 'react';
import { useState } from 'react';
import ProductCard from './ProductCard';
import { Link } from 'react-router-dom';
import { furnitureItems } from '../data/FurnitureItems';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Features = () => {
  const [products] = useState(furnitureItems.slice(0, 6));
  const sectionRef = useRef(null);
  const buttonRef = useRef(null);

  // Magnetic button effect
  const handleMouseMove = useCallback((e) => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(btn, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.4,
      ease: 'power2.out',
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.3)',
    });
  }, []);

  useLayoutEffect(() => {
    const cardHandlers = [];

    const ctx = gsap.context(() => {
      // Section header entrance
      const headerTL = gsap.timeline({
        scrollTrigger: {
          trigger: '.features-header',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });

      headerTL
        .from('.features-title', {
          y: 80,
          opacity: 0,
          duration: 1,
          ease: 'power4.out',
        })
        .from(
          '.features-subtitle',
          {
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.5',
        )
        .fromTo(
          '.features-divider',
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.8,
            ease: 'power2.inOut',
            transformOrigin: 'center center',
          },
          '-=0.4',
        );

      // Cards stagger with 3D perspective
      const cards = gsap.utils.toArray('.feature-card');
      cards.forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          y: 100,
          opacity: 0,
          rotateY: i % 2 === 0 ? -8 : 8,
          rotateX: 5,
          scale: 0.9,
          duration: 1,
          delay: i * 0.12,
          ease: 'power3.out',
          clearProps: 'transform',
        });
      });

      // 3D tilt on hover for each card — store references for cleanup
      cards.forEach((card) => {
        const handleCardMove = (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;

          gsap.to(card, {
            rotateY: x * 10,
            rotateX: -y * 10,
            scale: 1.03,
            boxShadow: `${x * 20}px ${y * 20}px 40px rgba(0,0,0,0.15)`,
            duration: 0.4,
            ease: 'power2.out',
          });
        };

        const handleCardLeave = () => {
          gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            scale: 1,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            duration: 0.6,
            ease: 'elastic.out(1, 0.5)',
          });
        };

        card.style.perspective = '1000px';
        card.style.transformStyle = 'preserve-3d';
        card.addEventListener('mousemove', handleCardMove);
        card.addEventListener('mouseleave', handleCardLeave);
        cardHandlers.push({ card, handleCardMove, handleCardLeave });
      });

      // Button entrance
      gsap.from('.features-btn-wrapper', {
        scrollTrigger: {
          trigger: '.features-btn-wrapper',
          start: 'top 90%',
        },
        y: 50,
        opacity: 0,
        duration: 0.9,
        ease: 'back.out(1.4)',
      });
    }, sectionRef);

    return () => {
      // Clean up manually added event listeners
      cardHandlers.forEach(({ card, handleCardMove, handleCardLeave }) => {
        card.removeEventListener('mousemove', handleCardMove);
        card.removeEventListener('mouseleave', handleCardLeave);
      });
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="bg-gradient-to-b from-secondary to-muted py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="features-header text-center mb-16">
          <h2 className="features-title text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
            Featured Collection
          </h2>
          <div className="features-divider h-[3px] w-16 bg-primary mx-auto mb-4 rounded-full" />
          <p className="features-subtitle max-w-2xl mx-auto text-muted-foreground text-lg">
            Handpicked pieces that blend functionality with exceptional design
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="feature-card">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Magnetic Button */}
        <div className="features-btn-wrapper text-center mt-14">
          <Link to="/shop">
            <button
              ref={buttonRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="px-8 py-4 bg-card text-primary border-2 border-primary rounded-xl shadow-lg hover:bg-primary hover:text-primary-foreground transition-colors duration-300 text-lg font-medium"
            >
              View All Products
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Features;
