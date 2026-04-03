import { ShoppingCart, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext';
import { useWishlist } from '../context/wishlistContext';
import { toast } from 'react-hot-toast';
import { useState, memo, useMemo } from 'react';

const isObjectId = (val) => typeof val === 'string' && /^[a-f\d]{24}$/i.test(val);

const isSafeUrl = (url) => {
  if (typeof url !== 'string' || !url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const resolveImage = (product) => {
  if (product.primaryImage && typeof product.primaryImage === 'object') {
    const url = product.primaryImage.secureUrl || product.primaryImage.url;
    if (url && isSafeUrl(url)) {
      return url;
    }
  }

  if (typeof product.primaryImage === 'string' && !isObjectId(product.primaryImage)) {
    if (isSafeUrl(product.primaryImage)) {
      return product.primaryImage;
    }
  }

  if (product.image && typeof product.image === 'object') {
    const url = product.image.secureUrl || product.image.url;
    if (url && isSafeUrl(url)) {
      return url;
    }
  }

  if (typeof product.image === 'string') {
    if (isSafeUrl(product.image)) {
      return product.image;
    }
  }

  return '';
};

const ProductCard = memo(function ProductCard({ product }) {
  const { auth } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const inWishlist = isInWishlist(product._id || product.id);

  const productName = product.name || product.title || 'Product';
  const productId = product._id || product.id;
  const productImage = useMemo(() => resolveImage(product), [product]);
  const categoryName =
    typeof product.category === 'object' ? product.category.name : product.category;

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    if (!auth.authenticate) {
      toast.error('Please sign in to save to wishlist');
      navigate('/auth');
      return;
    }
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

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
            loading="lazy"
            decoding="async"
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

        <p className="text-primary text-2xl font-bold mb-4">£{(product.price || 0).toFixed(2)}</p>

        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-dark transition ${
              isAdding ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
          <button
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
            className={`h-10 w-10 flex items-center justify-center rounded-md border transition-colors disabled:opacity-60 ${
              inWishlist
                ? 'border-destructive bg-destructive/10 text-destructive'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
