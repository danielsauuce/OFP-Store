import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getAllCategoriesService } from '../services/categoryService';
import { getAllProductsService } from '../services/productService';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Fallback editorial furniture images (used if category has no image)
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
  'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=800&q=80',
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
];

function resolveImage(cat, index) {
  const url = cat.image?.secureUrl || cat.image?.url || cat.image;
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function CollectionCard({ cat, index, large }) {
  return (
    <Link
      to={`/shop?category=${cat.slug}`}
      className={`group relative overflow-hidden rounded-2xl bg-muted block ${large ? 'row-span-2' : ''}`}
      style={{ minHeight: large ? 420 : 200 }}
    >
      <img
        src={resolveImage(cat, index)}
        alt={cat.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="text-white text-sm font-medium uppercase tracking-wide mb-2">{cat.name}</p>
        <span className="inline-flex items-center gap-1.5 text-white/80 text-xs font-medium border border-white/40 rounded-full px-3 py-1 group-hover:bg-white/20 transition-colors">
          View all products <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

const CollectionGrid = () => {
  const [categories, setCategories] = useState([]);
  const sectionRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const [catRes, prodRes] = await Promise.allSettled([
        getAllCategoriesService(),
        getAllProductsService({ limit: 100 }),
      ]);

      const dbCats =
        catRes.status === 'fulfilled' && catRes.value?.success ? catRes.value.categories || [] : [];

      // Extract unique populated category objects from products
      const products =
        prodRes.status === 'fulfilled' && prodRes.value?.success
          ? prodRes.value.data?.products || []
          : [];

      // Merge DB categories + categories derived from products.
      // Key by _id when present, fall back to lowercased name so categories
      // without a DB document (resolved as { name, slug }) are still included.
      const catsMap = new Map();
      for (const c of dbCats) {
        catsMap.set(c._id ? c._id.toString() : c.name.toLowerCase(), c);
      }
      for (const p of products) {
        const cat = p.category;
        if (cat && typeof cat === 'object' && cat.name) {
          const key = cat._id ? cat._id.toString() : cat.name.toLowerCase();
          if (!catsMap.has(key)) {
            if (!cat.slug) {
              cat.slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            }
            catsMap.set(key, cat);
          }
        }
      }

      setCategories([...catsMap.values()].slice(0, 5));
    };
    load();
  }, []);

  useLayoutEffect(() => {
    if (window.Cypress || categories.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.from('.cg-header', {
        scrollTrigger: {
          trigger: '.cg-header',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
      gsap.from('.cg-card', {
        scrollTrigger: {
          trigger: '.cg-grid',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [categories]);

  if (categories.length === 0) return null;

  // Bento layout: first card is large (spans 2 rows), rest fill a 2-column right side
  const [large, ...rest] = categories;

  return (
    <section ref={sectionRef} className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="cg-header text-center mb-12">
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3">
            Categories
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Shop By Collection
          </h2>
          <div className="h-[2px] w-14 bg-primary mx-auto" />
        </div>

        {/* Bento grid */}
        <div
          className="cg-grid grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{ gridAutoRows: '200px' }}
        >
          {/* Large card — spans 2 columns and 2 rows on md+ */}
          <div className="cg-card md:col-span-2 md:row-span-2">
            <CollectionCard cat={large} index={0} large />
          </div>

          {/* Smaller cards filling the right column */}
          {rest.slice(0, 4).map((cat, i) => (
            <div key={cat._id || cat.slug || `cat-fallback-${i}`} className="cg-card">
              <CollectionCard cat={cat} index={i + 1} large={false} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionGrid;
