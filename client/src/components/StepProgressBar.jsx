import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const StepProgressBar = ({ currentStep, totalSteps = 3 }) => {
  const barRef = useRef(null);

  useLayoutEffect(() => {
    if (!barRef.current) return;
    const segments = barRef.current.querySelectorAll('.progress-segment');

    segments.forEach((seg, i) => {
      if (i < currentStep) {
        gsap.to(seg, {
          scaleX: 1,
          backgroundColor: 'var(--color-primary)',
          duration: 0.5,
          delay: i * 0.1,
          ease: 'power2.out',
          transformOrigin: 'left',
        });
      } else {
        gsap.to(seg, {
          scaleX: 1,
          backgroundColor: 'var(--color-muted)',
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    });
  }, [currentStep]);

  return (
    <div ref={barRef} className="flex gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`progress-segment h-1.5 flex-1 rounded-full ${
            i < currentStep ? 'bg-primary' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );
};

export default StepProgressBar;
