import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { furnitureItems } from '../data/FurnitureItems';
import ProductCard from '../components/ProductCard';

const ProductDetails = () => {
  const { id } = useParams();
  const product = furnitureItems.find((item) => item.id === Number(id));
  const [quantity, setQuantity] = useState(1);

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

  const relatedProducts = furnitureItems
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    // TODO: integrate with cart context/service
    toast.success(`${quantity} x ${product.title} added to cart!`);
  };

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
              <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {/* Category Badge */}
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground mb-2">
                {product.category}
              </span>
              <h1 className="text-4xl font-serif font-bold mb-4 text-foreground">
                {product.title}
              </h1>
              <p className="text-3xl font-bold text-primary mb-6">£{product.price.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
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
                  <p className="text-muted-foreground">{product.dimensions}</p>
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
                disabled={!product.inStock}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
                  product.inStock
                    ? 'bg-primary text-primary-foreground hover:bg-primary-dark'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
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

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
