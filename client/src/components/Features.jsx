import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader } from 'lucide-react';
import ProductCard from './ProductCard';
import { getAllProductsService } from '../services/productService';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function SectionHeader({ tag, title, subtitle }) {
  return (
    <div className="text-center mb-12">
      {tag && (
        <span className="inline-block text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3">
          {tag}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">{title}</h2>
      <div className="h-[2px] w-14 bg-primary mx-auto mb-4 rounded-full" />
      {subtitle && <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>}
    </div>
  );
}

function CategoryTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
      }`}
    >
      {label}
    </button>
  );
}

const Features = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCatId, setActiveCatId] = useState(null); // null = All
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);
  const gridRef = useRef(null);

  // Fetch all products once and derive categories from them
  useEffect(() => {
    setLoading(true);
    getAllProductsService({ limit: 50 })
      .then((data) => {
        if (data?.success) {
          const products = data.data?.products || data.products || [];
          setAllProducts(products);

          // Extract unique populated category objects from products
          const seen = new Set();
          const cats = [];
          for (const p of products) {
            const cat = p.category;
            if (cat && typeof cat === 'object' && cat._id && cat.name) {
              const id = cat._id.toString();
              if (!seen.has(id)) {
                seen.add(id);
                cats.push(cat);
              }
            }
          }
          setCategories(cats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derived: products to display for the active tab (first 6)
  const displayProducts =
    activeCatId === null
      ? allProducts.slice(0, 6)
      : allProducts.filter((p) => p.category?._id?.toString() === activeCatId).slice(0, 6);

  // Fade grid in when products change
  useEffect(() => {
    if (!loading && gridRef.current) {
      gsap.fromTo(
        gridRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
      );
    }
  }, [loading, activeCatId]);

  // Scroll entrance for section header (once on mount)
  useLayoutEffect(() => {
    if (window.Cypress) return;
    const ctx = gsap.context(() => {
      gsap.from('.features-header-inner', {
        scrollTrigger: {
          trigger: '.features-header-inner',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 50,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Animate tabs in once categories have loaded
  const tabsAnimated = useRef(false);
  useEffect(() => {
    if (categories.length === 0 || tabsAnimated.current || window.Cypress) return;
    tabsAnimated.current = true;
    gsap.from('.features-tabs', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' });
  }, [categories]);

  return (
    <section ref={sectionRef} className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="features-header-inner">
          <SectionHeader
            tag="Collections"
            title="Our New Collections"
            subtitle="These products are carefully curated based on their excellent aesthetic and craftsmanship"
          />
        </div>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="features-tabs flex flex-wrap justify-center gap-2 mb-10">
            <CategoryTab
              label="All"
              active={activeCatId === null}
              onClick={() => setActiveCatId(null)}
            />
            {categories.map((cat) => (
              <CategoryTab
                key={cat._id}
                label={cat.name}
                active={activeCatId === cat._id.toString()}
                onClick={() => setActiveCatId(cat._id.toString())}
              />
            ))}
          </div>
        )}

        {/* Product grid */}
        <div ref={gridRef}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : displayProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">
              No products found in this category.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProducts.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-7 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
          >
            See More Collection
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Features;
