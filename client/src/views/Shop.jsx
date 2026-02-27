import { useState, useEffect, useMemo, useLayoutEffect, useRef } from 'react';
import { Loader } from 'lucide-react';
import { getAllProductsService } from '../services/productService';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import CategoryFilter from '../components/CategoryFilter';
import PriceRangeFilter from '../components/PriceRangeFilter';
import SortSelect from '../components/SortSelect';
import ProductGrid from '../components/ProductGrid';
import LoadMoreButton from '../components/LoadMoreButton';

gsap.registerPlugin(ScrollTrigger);

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(6);

  const pageRef = useRef(null);
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getAllProductsService({ limit: 100 });
      if (data?.success) {
        setProducts(data.data?.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  // GSAP entrance animations — runs once after loading completes
  useLayoutEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      // Page header entrance
      gsap.from(headerRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      });

      // Sidebar slides in from left
      gsap.from(sidebarRef.current, {
        x: -60,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        ease: 'power3.out',
      });

      // Product cards stagger entrance
      const cards = gsap.utils.toArray('.shop-product-card');
      gsap.from(cards, {
        y: 60,
        opacity: 0,
        scale: 0.95,
        duration: 0.7,
        stagger: 0.1,
        delay: 0.35,
        ease: 'power3.out',
        clearProps: 'transform',
      });

      // Sort bar fade in
      gsap.from('.shop-toolbar', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.3,
        ease: 'power2.out',
      });
    }, pageRef);

    return () => ctx.revert();
  }, [loading]);

  // Build category list from fetched products
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      const name = typeof p.category === 'object' ? p.category.name : p.category;
      if (name) cats.add(name);
    });
    return ['All', ...Array.from(cats).sort()];
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products;

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((item) => {
        const cat = typeof item.category === 'object' ? item.category.name : item.category;
        return cat === selectedCategory;
      });
    }

    // Price filter
    result = result.filter((item) => item.price >= priceRange[0] && item.price <= priceRange[1]);

    // Sort
    const sortMap = {
      'price-low': (a, b) => a.price - b.price,
      'price-high': (a, b) => b.price - a.price,
      name: (a, b) => (a.name || '').localeCompare(b.name || ''),
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    };

    return [...result].sort(sortMap[sortBy] || sortMap.newest);
  }, [products, selectedCategory, priceRange, sortBy]);

  const visibleProducts = filteredAndSortedProducts.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={pageRef} className="min-h-screen py-12 bg-background text-foreground">
      <div className="container mx-auto px-4">
        <h1 ref={headerRef} className="text-4xl font-serif font-bold mb-8">
          Shop Furniture
        </h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside
            ref={sidebarRef}
            className="lg:col-span-1 space-y-6 bg-card p-6 rounded-lg shadow-card"
          >
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onChange={(cat) => {
                setSelectedCategory(cat);
                setVisibleCount(6);
              }}
            />

            <PriceRangeFilter range={priceRange} onChange={setPriceRange} />
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="shop-toolbar flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <p className="text-muted-foreground">
                Showing {visibleProducts.length} of {filteredAndSortedProducts.length} products
              </p>

              <SortSelect value={sortBy} onChange={setSortBy} />
            </div>

            {/* Products */}
            {visibleProducts.length ? (
              <>
                <ProductGrid products={visibleProducts} />
                <LoadMoreButton
                  hasMore={visibleCount < filteredAndSortedProducts.length}
                  onClick={handleLoadMore}
                />
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  No products found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
