import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, ArrowLeft, Loader, Heart, Star, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProductByIdService } from '../services/productService';
import { getProductReviewsService, createReviewService } from '../services/reviewService';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext';
import { useWishlist } from '../context/wishlistContext';
import Avatar from '../views/admin/components/Avatar';

const ProductDetails = () => {
  const { id } = useParams();
  const { auth } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewPagination, setReviewPagination] = useState(null);

  // New review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
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

  const fetchReviews = async (page = 1) => {
    setReviewsLoading(true);
    try {
      const data = await getProductReviewsService(id, { page, limit: 5 });
      if (data?.success) {
        setReviews(page === 1 ? data.reviews : [...reviews, ...data.reviews]);
        setReviewPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setReviewsLoading(false);
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

  const handleToggleWishlist = async () => {
    if (!auth.authenticate) {
      toast.error('Please sign in to use your wishlist');
      return;
    }
    setWishlistLoading(true);
    try {
      if (isInWishlist(product._id)) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product._id);
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!auth.authenticate) {
      toast.error('Please sign in to leave a review');
      return;
    }
    if (!reviewContent.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmittingReview(true);
    try {
      const data = await createReviewService({
        product: id,
        rating: reviewRating,
        content: reviewContent.trim(),
      });
      if (data?.success) {
        toast.success(data.message || 'Review submitted! It will appear after approval.');
        setReviewContent('');
        setReviewRating(5);
        setShowReviewForm(false);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const inWishlist = product ? isInWishlist(product._id) : false;

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

              {product.material && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Material</h3>
                  <p className="text-muted-foreground">{product.material}</p>
                </div>
              )}

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

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || adding}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
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

                <button
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  className={`p-3 rounded-md border transition-colors ${
                    inWishlist
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  } disabled:opacity-60`}
                  title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-6 space-y-2 text-sm text-muted-foreground">
              <p>✓ Free shipping on orders over £500</p>
              <p>✓ 30-day return policy</p>
              <p>✓ 2-year warranty included</p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-foreground">
              Customer Reviews
              {reviewPagination?.total > 0 && (
                <span className="text-lg font-normal text-muted-foreground ml-2">
                  ({reviewPagination.total})
                </span>
              )}
            </h2>
            {auth.authenticate && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <h3 className="font-semibold text-foreground mb-4">Write Your Review</h3>

              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setReviewRating(star)} className="p-0.5">
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          star <= reviewRating ? 'text-gold fill-gold' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Your Review
                </label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  rows={4}
                  placeholder="Share your experience with this product..."
                  className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || !reviewContent.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {submittingReview ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}

          {/* Reviews List */}
          {reviewsLoading && reviews.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">
                No reviews yet. Be the first to review this product!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-start gap-4">
                    <Avatar
                      name={review.user?.fullName || 'Anonymous'}
                      size="h-10 w-10"
                      textSize="text-sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          {review.user?.fullName || 'Anonymous'}
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                            Verified Purchase
                          </span>
                        )}
                      </div>

                      <div className="flex gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'text-gold fill-gold'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>

                      <p className="text-foreground text-sm">{review.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More Reviews */}
              {reviewPagination && reviewPagination.page < reviewPagination.pages && (
                <button
                  onClick={() => fetchReviews(reviewPagination.page + 1)}
                  disabled={reviewsLoading}
                  className="w-full py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  {reviewsLoading ? 'Loading...' : 'Load More Reviews'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
