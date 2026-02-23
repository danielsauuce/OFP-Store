import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addToCartService } from '../services/cartService';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';

const ProductCard = ({ product }) => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    // Redirect to auth if not logged in
    if (!auth.authenticate) {
      toast.error('Please login to add items to cart');
      navigate('/auth');
      return;
    }

    setIsAdding(true);
    try {
      const data = await addToCartService(product._id || product.id, 1);

      if (data?.success) {
        toast.success(`${product.title} added to cart`);
      } else {
        toast.error(data?.message || 'Failed to add to cart');
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to add to cart';
      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 group">
      {/* Image */}
      <Link to={`/product/${product._id || product.id}`}>
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

        <Link to={`/product/${product._id || product.id}`}>
          <h3 className="font-serif font-semibold text-lg mb-2 line-clamp-1 hover:underline text-foreground">
            {product.title}
          </h3>
        </Link>

        <p className="text-primary text-2xl font-bold mb-4">£{product.price.toFixed(2)}</p>

        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className={`w-full h-10 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-dark transition ${
            isAdding ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
          {isAdding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
