import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLayoutEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function Hero() {
  const heroRef = useRef(null);
  const imageRef = useRef(null);
  const buttonRef = useRef(null);
  const overlayRef = useRef(null);
  const particleContainerRef = useRef(null);

  const heroImage =
    'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=900&auto=format&fit=crop&q=60';

  // Create floating particle elements
  const createParticles = useCallback((container) => {
    if (!container) return;
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'hero-particle';
      particle.style.cssText = `
        position: absolute;
        width: ${gsap.utils.random(4, 12)}px;
        height: ${gsap.utils.random(4, 12)}px;
        background: radial-gradient(circle, rgba(255,255,255,0.3), transparent);
        border-radius: 50%;
        top: ${gsap.utils.random(0, 100)}%;
        left: ${gsap.utils.random(0, 100)}%;
        pointer-events: none;
      `;
      container.appendChild(particle);
    }
  }, []);

  useLayoutEffect(() => {
    let enterHandler;
    let leaveHandler;
    const btn = buttonRef.current;

    const ctx = gsap.context(() => {
      // Create particles
      createParticles(particleContainerRef.current);

      // Master entrance timeline
      const masterTL = gsap.timeline({
        defaults: { ease: 'power4.out' },
      });

      // Cinematic image reveal with effect
      masterTL.fromTo(
        imageRef.current,
        { scale: 1.4, filter: 'brightness(0.3) blur(10px)' },
        { scale: 1.1, filter: 'brightness(0.7) blur(0px)', duration: 2.2 },
      );

      // Overlay gradient sweep
      masterTL.fromTo(overlayRef.current, { opacity: 1 }, { opacity: 0.6, duration: 1.5 }, '-=1.8');

      // Split title characters animation
      const titleChars = heroRef.current.querySelectorAll('.hero-char');
      masterTL.from(
        titleChars,
        {
          y: 120,
          opacity: 0,
          rotateX: -90,
          duration: 1,
          stagger: {
            each: 0.03,
            from: 'start',
          },
          ease: 'back.out(1.4)',
        },
        '-=1.4',
      );

      // Decorative line wipe
      masterTL.fromTo(
        '.hero-line',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.8, ease: 'power2.inOut' },
        '-=0.6',
      );

      // Subtitle words stagger
      const subtitleWords = heroRef.current.querySelectorAll('.hero-word');
      masterTL.from(
        subtitleWords,
        {
          y: 50,
          opacity: 0,
          duration: 0.7,
          stagger: 0.04,
          ease: 'power3.out',
        },
        '-=0.5',
      );

      // Button entrance with elastic bounce
      masterTL.from(
        buttonRef.current,
        {
          y: 40,
          opacity: 0,
          scale: 0.8,
          duration: 0.9,
          ease: 'elastic.out(1, 0.5)',
          clearProps: 'all',
        },
        '-=0.4',
      );

      // Floating particles continuous animation
      const particles = heroRef.current.querySelectorAll('.hero-particle');
      particles.forEach((p) => {
        gsap.to(p, {
          y: gsap.utils.random(-60, 60),
          x: gsap.utils.random(-40, 40),
          opacity: gsap.utils.random(0.1, 0.6),
          duration: gsap.utils.random(3, 7),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: gsap.utils.random(0, 3),
        });
      });

      // Parallax on scroll
      gsap.to(imageRef.current, {
        y: 100,
        scale: 1.15,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
      });

      gsap.to('.hero-content', {
        y: -60,
        opacity: 0.3,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '80% top',
          scrub: 1,
        },
      });

      // Button hover animation — store references for cleanup
      const hoverTL = gsap.timeline({ paused: true });
      hoverTL
        .to(btn, {
          scale: 1.07,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          duration: 0.35,
          ease: 'power2.out',
        })
        .to(
          '.hero-arrow',
          {
            x: 8,
            duration: 0.35,
            ease: 'power2.out',
          },
          0,
        );

      enterHandler = () => hoverTL.play();
      leaveHandler = () => hoverTL.reverse();
      btn.addEventListener('mouseenter', enterHandler);
      btn.addEventListener('mouseleave', leaveHandler);
    }, heroRef);

    return () => {
      // Clean up manually added event listeners
      if (btn && enterHandler && leaveHandler) {
        btn.removeEventListener('mouseenter', enterHandler);
        btn.removeEventListener('mouseleave', leaveHandler);
      }
      ctx.revert();
    };
  }, [createParticles]);

  // Split text into characters for animation
  const splitTitle = (text) => {
    return text.split('').map((char, i) => (
      <span
        key={i}
        className="hero-char inline-block"
        style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  // Split subtitle into words
  const subtitleText =
    'Discover timeless furniture pieces crafted with precision and passion. Transform your house into a home with our curated collections.';
  const splitSubtitle = subtitleText.split(' ').map((word, i) => (
    <span key={i} className="hero-word inline-block mr-[0.3em]">
      {word}
    </span>
  ));

  return (
    <section
      ref={heroRef}
      className="relative h-[700px] md:h-[85vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          ref={imageRef}
          src={heroImage}
          alt="Luxury furniture showroom"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Gradient Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"
      />

      {/* Floating Particles */}
      <div
        ref={particleContainerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none z-10"
      />

      {/* Content */}
      <div className="hero-content relative container mx-auto px-4 z-20">
        <div className="max-w-2xl">
          {/* Title with split characters */}
          <h1
            className="text-5xl md:text-7xl font-serif font-bold mb-4 text-white leading-tight"
            style={{ perspective: '1000px' }}
          >
            {splitTitle('Elevate Your')}
            <br />
            {splitTitle('Living Space')}
          </h1>

          {/* Decorative line */}
          <div className="hero-line h-[3px] w-24 bg-primary mb-6 rounded-full" />

          {/* Subtitle with split words */}
          <p className="text-lg md:text-xl mb-10 text-white/90 leading-relaxed max-w-xl">
            {splitSubtitle}
          </p>

          <Link to="/shop">
            <button
              ref={buttonRef}
              className="rounded-xl bg-primary text-primary-foreground flex items-center px-8 py-4 shadow-lg text-lg font-medium tracking-wide"
            >
              Shop Now
              <ArrowRight className="ml-3 h-5 w-5 hero-arrow" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;
