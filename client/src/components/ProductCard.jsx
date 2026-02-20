import { useState } from 'react';
import { ShoppingCart, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/authContext';
import { addToCartService } from '../services/cartService';

const ProductCard = ({ product }) => {
  const { auth } = useAuth();
  const [adding, setAdding] = useState(false);

  // Support both API products (_id, name, primaryImage) and static data (id, title, image)
  const productId = product._id || product.id;
  const productName = product.name || product.title;
  const productImage =
    product.primaryImage?.secureUrl || product.primaryImage?.url || product.image || '';
  const categoryName =
    typeof product.category === 'object' ? product.category.name : product.category;
  const isApiProduct = !!product._id;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!auth.authenticate) {
      toast.error('Please sign in to add items to your cart');
      return;
    }

    if (!isApiProduct) {
      toast.error('This product cannot be added to cart');
      return;
    }

    setAdding(true);
    try {
      const data = await addToCartService(product._id, 1);
      if (data?.success) {
        toast.success(`${productName} added to cart!`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-xl transition duration-300 group border border-border">
      {/* Image */}
      <Link to={`/product/${productId}`}>
        <img
          src={productImage}
          alt={productName}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* Info */}
      <div className="p-6">
        <p className="text-xs uppercase text-muted-foreground mb-1 tracking-wider">
          {categoryName}
        </p>

        <Link to={`/product/${productId}`}>
          <h3 className="font-serif font-semibold text-lg mb-2 line-clamp-1 text-foreground hover:underline">
            {productName}
          </h3>
        </Link>

        <p className="text-primary text-2xl font-bold mb-4">£{product.price.toFixed(2)}</p>

        <button
          onClick={handleAddToCart}
          disabled={adding}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-dark transition disabled:opacity-60"
        >
          {adding ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            <ShoppingCart className="h-5 w-5" />
          )}
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
