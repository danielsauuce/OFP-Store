import { ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext';
import toast from 'react-hot-toast';
import { useState } from 'react';

/**
 * Resolves the display image URL from a product object.
 * Handles all possible shapes:
 *  - product.primaryImage.secureUrl  (populated Media doc)
 *  - product.primaryImage.url        (populated Media doc fallback)
 *  - product.primaryImage            (raw URL string)
 *  - product.image.secureUrl         (stray field, populated)
 *  - product.image                   (raw URL string e.g. from static data)
 *
 * If primaryImage/image is a raw MongoDB ObjectId string (24-char hex),
 * it means the backend didn't resolve it — return empty so we don't
 * render a broken <img> pointing at an ObjectId.
 */
const isObjectId = (val) => typeof val === 'string' && /^[a-f\d]{24}$/i.test(val);

const resolveImage = (product) => {
  // 1. Populated primaryImage object
  if (product.primaryImage && typeof product.primaryImage === 'object') {
    return product.primaryImage.secureUrl || product.primaryImage.url || '';
  }

  // 2. primaryImage as a direct URL string (not an ObjectId)
  if (typeof product.primaryImage === 'string' && !isObjectId(product.primaryImage)) {
    return product.primaryImage;
  }

  // 3. Stray 'image' field — populated object
  if (product.image && typeof product.image === 'object') {
    return product.image.secureUrl || product.image.url || '';
  }

  // 4. image as a direct URL string (not an ObjectId)
  if (typeof product.image === 'string' && !isObjectId(product.image)) {
    return product.image;
  }

  return '';
};

const ProductCard = ({ product }) => {
  const { auth } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);

  const productName = product.name || product.title || 'Product';
  const productId = product._id || product.id;
  const productImage = resolveImage(product);
  const categoryName =
    typeof product.category === 'object' ? product.category.name : product.category;

  const handleAddToCart = async () => {
    if (!auth.authenticate) {
      toast.error('Please login to add items to cart');
      navigate('/auth');
      return;
    }

    setIsAdding(true);
    try {
      const result = await addItem(productId, 1);

      if (result?.success) {
        toast.success(`${productName} added to cart`);
      } else {
        toast.error(result?.message || 'Failed to add to cart');
      }
    } catch (error) {
      const errorMessage = error?.message || 'Failed to add to cart';
      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 group">
      {/* Image */}
      <Link to={`/product/${productId}`}>
        {productImage ? (
          <img
            src={productImage}
            alt={productName}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-64 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-6">
        {categoryName && (
          <p className="text-xs uppercase text-muted-foreground mb-1 tracking-wider">
            {categoryName}
          </p>
        )}

        <Link to={`/product/${productId}`}>
          <h3 className="font-serif font-semibold text-lg mb-2 line-clamp-1 hover:underline text-foreground">
            {productName}
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
