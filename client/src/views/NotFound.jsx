import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import gsap from 'gsap';

const NotFound = () => {
  const pageRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      // 404 number
      tl.from('.nf-404', {
        y: -120,
        opacity: 0,
        scale: 0.5,
        duration: 0.9,
        ease: 'bounce.out',
      });

      // Subtitle slides up
      tl.from('.nf-title', { y: 40, opacity: 0, duration: 0.7 }, '-=0.3');

      // Description fades in
      tl.from('.nf-desc', { y: 25, opacity: 0, duration: 0.6 }, '-=0.3');

      // Button bounces in
      tl.from(
        '.nf-btn',
        {
          y: 30,
          opacity: 0,
          scale: 0.9,
          duration: 0.6,
          ease: 'back.out(2)',
        },
        '-=0.2',
      );

      // Gentle floating on the 404
      gsap.to('.nf-404', {
        y: -10,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1,
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="nf-404 mb-4 text-8xl md:text-9xl font-serif font-bold text-primary">404</h1>
        <p className="nf-title mb-2 text-3xl font-semibold text-foreground">Page Not Found</p>
        <p className="nf-desc mb-8 text-lg text-muted-foreground max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <button className="nf-btn flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors mx-auto font-medium">
            <Home className="mr-2 h-5 w-5" />
            Return to Home
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
