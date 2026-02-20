import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-xl transition duration-300 group border border-border">
      {/* Image */}
      <Link to={`/product/${product.id}`}>
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* Info */}
      <div className="p-6">
        <p className="text-xs uppercase text-muted-foreground mb-1 tracking-wider">
          {product.category}
        </p>

        <Link to={`/product/${product.id}`}>
          <h3 className="font-serif font-semibold text-lg mb-2 line-clamp-1 text-foreground hover:underline">
            {product.title}
          </h3>
        </Link>

        <p className="text-primary text-2xl font-bold mb-4">£{product.price.toFixed(2)}</p>

        <button className="w-full h-10 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-dark transition">
          <ShoppingCart className="h-5 w-5" />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
