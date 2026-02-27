import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const CategoryFilter = ({ categories, selected, onChange }) => {
  const listRef = useRef(null);
  const hasAnimated = useRef(false);

  useLayoutEffect(() => {
    // Animate category buttons in on first render only
    if (hasAnimated.current || !listRef.current) return;
    hasAnimated.current = true;

    const buttons = listRef.current.querySelectorAll('.cat-btn');
    gsap.from(buttons, {
      x: -30,
      opacity: 0,
      duration: 0.5,
      stagger: 0.06,
      ease: 'power2.out',
    });
  }, [categories]);

  return (
    <div className="mb-6">
      <label className="mb-3 block font-semibold text-card-foreground">Categories</label>
      <div ref={listRef} className="space-y-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onChange(category)}
            className={`cat-btn w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
              selected === category
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-foreground'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
