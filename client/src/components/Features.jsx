import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Link } from 'react-router-dom';
import { getAllProductsService } from '../services/productService';

const Features = () => {
  const [products, setProducts] = useState([]);

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

  return (
    <section className="bg-gradient-to-b from-secondary to-muted py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold mb-4 text-foreground">
            Featured Collection
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            Handpicked pieces that blend functionality with exceptional design
          </p>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Loading products...</div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link to="/shop">
            <button className="px-6 py-3 bg-card text-primary border-2 border-primary rounded-md shadow hover:bg-primary hover:text-primary-foreground transition">
              View All Products
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Features;
