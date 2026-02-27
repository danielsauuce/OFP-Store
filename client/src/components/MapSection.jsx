import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MapSection = () => {
  const mapRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(mapRef.current, {
        scrollTrigger: {
          trigger: mapRef.current,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
        y: 60,
        opacity: 0,
        scale: 0.98,
        duration: 0.9,
        ease: 'power3.out',
      });
    }, mapRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={mapRef} className="bg-card rounded-2xl overflow-hidden shadow-card">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.6638820364896!2d3.4207436!3d6.4281242!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8b2ae68280c1%3A0xdc9e87a367c3d9cb!2sLagos%2C%20Nigeria!5e0!3m2!1sen!2sus!4v1234567890"
        className="w-full aspect-video"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Olayinka Furniture Palace Location"
      />
    </div>
  );
};

export default MapSection;
