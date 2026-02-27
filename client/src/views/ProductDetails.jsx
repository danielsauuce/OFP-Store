import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, ArrowLeft, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProductByIdService } from '../services/productService';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext';

const ProductDetails = () => {
  const { id } = useParams();
  const { auth } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await getProductByIdService(id);
      if (data?.success) {
        setProduct(data.product);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!auth.authenticate) {
      toast.error('Please sign in to add items to your cart');
      return;
    }

    setAdding(true);
    try {
      const result = await addItem(product._id, quantity);
      if (result?.success) {
        toast.success(`${quantity} x ${product.name} added to cart!`);
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Product not found</h2>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  // Extract image URL from populated primaryImage
  const imageUrl = product.primaryImage?.secureUrl || product.primaryImage?.url || '';
  const categoryName =
    typeof product.category === 'object' ? product.category.name : product.category;

  return (
    <div className="min-h-screen py-12 bg-background text-foreground">
      <div className="container mx-auto px-4">
        {/* Back to Shop */}
        <Link
          to="/shop"
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden shadow-card border border-border">
              <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {/* Category Badge */}
              {categoryName && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground mb-2">
                  {categoryName}
                </span>
              )}
              <h1 className="text-4xl font-serif font-bold mb-4 text-foreground">{product.name}</h1>
              <p className="text-3xl font-bold text-primary mb-6">£{product.price.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {product.description || product.shortDescription}
                </p>
              </div>

              {/* Material */}
              {product.material && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Material</h3>
                  <p className="text-muted-foreground">{product.material}</p>
                </div>
              )}

              {/* Dimensions */}
              {product.dimensions && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Dimensions</h3>
                  <p className="text-muted-foreground">
                    {product.dimensions.width && `${product.dimensions.width}cm (W)`}
                    {product.dimensions.height && ` × ${product.dimensions.height}cm (H)`}
                    {product.dimensions.depth && ` × ${product.dimensions.depth}cm (D)`}
                  </p>
                </div>
              )}

              {/* Availability */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Availability</h3>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.inStock ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-foreground">Quantity:</span>
                <div className="flex items-center border border-border rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!product.inStock}
                    className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium text-foreground">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!product.inStock}
                    className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock || adding}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
                  product.inStock
                    ? 'bg-primary text-primary-foreground hover:bg-primary-dark'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                } disabled:opacity-60`}
              >
                {adding ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <ShoppingCart className="h-5 w-5" />
                )}
                {product.inStock ? (adding ? 'Adding...' : 'Add to Cart') : 'Out of Stock'}
              </button>
            </div>

            {/* Additional Info */}
            <div className="border-t border-border pt-6 space-y-2 text-sm text-muted-foreground">
              <p>✓ Free shipping on orders over £500</p>
              <p>✓ 30-day return policy</p>
              <p>✓ 2-year warranty included</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
