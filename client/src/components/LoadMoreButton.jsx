import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const LoadMoreButton = ({ hasMore, onClick }) => {
  const btnRef = useRef(null);

  useLayoutEffect(() => {
    if (!hasMore || !btnRef.current) return;

    // Subtle entrance pulse when the button appears
    gsap.fromTo(
      btnRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
    );
  }, [hasMore]);

  if (!hasMore) return null;

  return (
    <div className="text-center mt-10">
      <button
        ref={btnRef}
        onClick={onClick}
        className="px-7 py-3 bg-card text-primary border-2 border-primary rounded-xl shadow hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-medium"
      >
        View More
      </button>
    </div>
  );
};

export default LoadMoreButton;
