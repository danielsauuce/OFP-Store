import ProductCard from './ProductCard';
import { Link } from 'react-router-dom';
import { furnitureItems } from '../data/FurnitureItems';

const Features = () => {
  const featuresProduct = furnitureItems.slice(0, 6);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresProduct.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

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
