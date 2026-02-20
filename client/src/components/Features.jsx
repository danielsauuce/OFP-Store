import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import { Link } from 'react-router-dom';
import { getAllProductsService } from '../services/productService';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Features = () => {
  const [products, setProducts] = useState([]);
  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await getAllProductsService({ limit: 6 });
        if (data?.success) {
          setProducts(data.data?.products || []);
        }
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      }
    };
    fetchFeatured();
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.from('.features-header', {
        scrollTrigger: {
          trigger: '.features-header',
          start: 'top 85%',
        },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      // Product cards stagger animation
      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: '.feature-grid',
          start: 'top 80%',
        },
        y: 80,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
      });

      // Button animation
      gsap.from('.features-button', {
        scrollTrigger: {
          trigger: '.features-button',
          start: 'top 90%',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [products]);

  return (
    <section ref={sectionRef} className="bg-gradient-to-b from-secondary to-muted py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="features-header text-center mb-12">
          <h2 className="text-4xl font-serif font-bold mb-4 text-foreground">
            Featured Collection
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            Handpicked pieces that blend functionality with exceptional design
          </p>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product._id} className="feature-card">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Loading products...</div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link to="/shop">
            <button className="features-button px-6 py-3 bg-card text-primary border-2 border-primary rounded-md shadow hover:bg-primary hover:text-primary-foreground transition">
              View All Products
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Features;
