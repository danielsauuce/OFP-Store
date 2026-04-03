import { ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext';
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
    if (url && isSafeUrl(url)) return url;
  }
  if (typeof product.primaryImage === 'string' && !isObjectId(product.primaryImage)) {
    if (isSafeUrl(product.primaryImage)) return product.primaryImage;
  }
  if (product.image && typeof product.image === 'object') {
    const url = product.image.secureUrl || product.image.url;
    if (url && isSafeUrl(url)) return url;
  }
  if (typeof product.image === 'string' && isSafeUrl(product.image)) return product.image;
  return '';
};

const ProductCard = memo(function ProductCard({ product }) {
  const { auth } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);

  const productName = product.name || product.title || 'Product';
  const productId = product._id || product.id;
  const productImage = useMemo(() => resolveImage(product), [product]);
  const categoryName =
    typeof product.category === 'object' ? product.category.name : product.category;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!auth.authenticate) {
      toast.error('Please sign in to add items to cart');
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
      toast.error(error?.message || 'Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link
      to={`/product/${productId}`}
      className="shop-product-card group block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3] bg-muted">
        {productImage ? (
          <img
            src={productImage}
            alt={productName}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
        {/* Category pill */}
        {categoryName && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-background/80 backdrop-blur-sm text-foreground border border-border/50">
            {categoryName}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-serif font-semibold text-base line-clamp-1 text-foreground group-hover:text-primary transition-colors mb-1">
          {productName}
        </h3>

        <div className="flex items-center justify-between mt-3">
          <p className="text-primary text-xl font-bold">£{(product.price || 0).toFixed(2)}</p>

          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isAdding
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary-dark'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {isAdding ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </Link>
  );
});

export default ProductCard;
