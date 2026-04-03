import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingCart,
  Minus,
  Plus,
  ArrowLeft,
  Loader,
  Heart,
  Star,
  Send,
  Truck,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Package,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getProductByIdService } from '../services/productService';
import { getProductReviewsService, createReviewService } from '../services/reviewService';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext';
import { useWishlist } from '../context/wishlistContext';

const StarRating = ({ rating, size = 'h-4 w-4', interactive = false, onRate }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => interactive && onRate?.(star)}
        disabled={!interactive}
        className={interactive ? 'cursor-pointer p-0.5 group' : 'cursor-default'}
        type="button"
      >
        <Star
          className={`${size} transition-colors ${
            star <= rating
              ? 'text-amber-400 fill-amber-400'
              : interactive
                ? 'text-muted-foreground group-hover:text-amber-300'
                : 'text-muted-foreground/40'
          }`}
        />
      </button>
    ))}
  </div>
);

const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 text-right text-muted-foreground tabular-nums">{star}</span>
      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-muted-foreground tabular-nums text-xs">{count}</span>
    </div>
  );
};

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
  const [descExpanded, setDescExpanded] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewPagination, setReviewPagination] = useState(null);
  const [ratingBreakdown, setRatingBreakdown] = useState({});

  // New review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const inWishlist = product ? isInWishlist(product._id) : false;

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await getProductByIdService(id);
      if (data?.success) setProduct(data.product);
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
        setReviews((prev) => (page === 1 ? data.reviews : [...prev, ...data.reviews]));
        setReviewPagination(data.pagination);
        // Build rating breakdown from all reviews on first page load
        if (page === 1 && data.reviews.length > 0) {
          const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          data.reviews.forEach((r) => {
            if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating]++;
          });
          setRatingBreakdown(breakdown);
        }
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
      if (result?.success) toast.success(`${quantity} × ${product.name} added to cart!`);
    } catch (error) {
      toast.error(error?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    setWishlistLoading(true);
    try {
      if (inWishlist) await removeFromWishlist(product._id);
      else await addToWishlist(product._id);
    } catch (err) {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    const trimmedContent = reviewContent.trim();
    if (!auth.authenticate) {
      toast.error('Please sign in to leave a review');
      return;
    }
    if (!trimmedContent) {
      toast.error('Please write a review');
      return;
    }
    if (trimmedContent.length < 10) {
      toast.error('Review must be at least 10 characters');
      return;
    }

    setSubmittingReview(true);
    try {
      const data = await createReviewService({
        product: id,
        rating: reviewRating,
        content: trimmedContent,
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
        <div className="text-center space-y-4">
          <Package className="h-16 w-16 text-muted-foreground mx-auto opacity-40" />
          <h2 className="text-2xl font-bold text-foreground">Product not found</h2>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const isObjectId = (val) => typeof val === 'string' && /^[a-f\d]{24}$/i.test(val);
  const resolveImg = () => {
    if (product.primaryImage && typeof product.primaryImage === 'object')
      return product.primaryImage.secureUrl || product.primaryImage.url || '';
    if (typeof product.primaryImage === 'string' && !isObjectId(product.primaryImage))
      return product.primaryImage;
    if (product.image && typeof product.image === 'object')
      return product.image.secureUrl || product.image.url || '';
    if (typeof product.image === 'string' && !isObjectId(product.image)) return product.image;
    return '';
  };
  const imageUrl = resolveImg();
  const categoryName =
    typeof product.category === 'object' ? product.category?.name : product.category;

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  const totalReviews = reviewPagination?.total || 0;
  const DESCRIPTION_LIMIT = 300;
  const longDesc = product.description && product.description.length > DESCRIPTION_LIMIT;

  const RATING_LABELS = { 5: 'Excellent', 4: 'Very Good', 3: 'Average', 2: 'Poor', 1: 'Terrible' };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-foreground transition-colors">
              Shop
            </Link>
            {categoryName && (
              <>
                <span>/</span>
                <span>{categoryName}</span>
              </>
            )}
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Back link */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Shop
        </Link>

        {/* ── Product Hero ─────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Image Panel */}
          <div className="space-y-3">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted border border-border shadow-card group">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-20 w-20 text-muted-foreground opacity-30" />
                </div>
              )}
              {!product.inStock && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="px-5 py-2.5 bg-card border border-border rounded-full text-sm font-semibold text-muted-foreground shadow-card">
                    Out of Stock
                  </span>
                </div>
              )}
              {categoryName && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-card/90 backdrop-blur-sm border border-border rounded-full text-xs font-medium text-foreground shadow-sm">
                    {categoryName}
                  </span>
                </div>
              )}
            </div>

            {/* Trust strip under image */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Truck, label: 'Free delivery', sub: 'Orders £500+' },
                { icon: RotateCcw, label: '30-day returns', sub: 'Hassle-free' },
                { icon: ShieldCheck, label: '2-year warranty', sub: 'Included' },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-card border border-border text-center"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground leading-tight">
                    {label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info Panel */}
          <div className="flex flex-col gap-6">
            {/* Name + Rating summary */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-serif font-bold text-foreground leading-tight mb-3">
                {product.name}
              </h1>
              {totalReviews > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(avgRating)} />
                  <span className="text-sm font-semibold text-foreground">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">£{product.price?.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through opacity-0 select-none">
                placeholder
              </span>
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-muted-foreground leading-relaxed">{product.shortDescription}</p>
            )}

            {/* Stock + SKU */}
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  product.inStock
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-destructive'}`}
                />
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
              {product.inStock && product.stockQuantity != null && product.stockQuantity <= 10 && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Only {product.stockQuantity} left
                </span>
              )}
            </div>

            {/* Material */}
            {product.material && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Material:</span>
                <span className="font-medium text-foreground">{product.material}</span>
              </div>
            )}

            <div className="h-px bg-border" />

            {/* Quantity + CTA */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-foreground">Quantity</span>
                <div className="flex items-center rounded-xl border border-border overflow-hidden bg-card">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || !product.inStock}
                    className="px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-14 text-center font-semibold text-foreground tabular-nums py-2.5">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(quantity + 1, product.stockQuantity || 99))}
                    disabled={!product.inStock || quantity >= (product.stockQuantity || 99)}
                    className="px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || adding}
                  className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {adding ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-5 w-5" />
                  )}
                  {adding ? 'Adding…' : product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>

                <button
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={`p-3.5 rounded-xl border transition-all disabled:opacity-50 ${
                    inWishlist
                      ? 'border-rose-300 bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 shadow-sm'
                      : 'border-border text-muted-foreground hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 transition-transform ${inWishlist ? 'fill-current scale-110' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Perks list */}
            <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-2.5">
              {[
                { icon: Truck, text: 'Free delivery on orders £500 or more' },
                { icon: RotateCcw, text: '30-day hassle-free returns' },
                { icon: ShieldCheck, text: '2-year manufacturer warranty included' },
                { icon: CheckCircle2, text: 'Authenticity guaranteed' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Description Section ─────────────────────────────────── */}
        {product.description && (
          <div className="mb-16 max-w-3xl">
            <h2 className="text-xl font-serif font-bold text-foreground mb-4">
              Product Description
            </h2>
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {longDesc && !descExpanded
                  ? product.description.slice(0, DESCRIPTION_LIMIT) + '…'
                  : product.description}
              </p>
              {longDesc && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="mt-3 flex items-center gap-1 text-sm text-primary font-medium hover:text-primary-dark transition-colors"
                >
                  {descExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" /> Read more
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Reviews Section ──────────────────────────────────────── */}
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Customer Reviews</h2>
              {totalReviews > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {totalReviews} verified {totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              )}
            </div>
            {auth.authenticate && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm"
              >
                <Star className="h-4 w-4" />
                Write a Review
              </button>
            )}
          </div>

          {/* Rating summary */}
          {totalReviews > 0 && (
            <div className="grid sm:grid-cols-2 gap-6 bg-card border border-border rounded-2xl p-6 mb-8 shadow-card">
              {/* Left — average */}
              <div className="flex flex-col items-center justify-center gap-2 sm:border-r border-border py-2">
                <span className="text-6xl font-bold text-foreground tabular-nums">
                  {avgRating.toFixed(1)}
                </span>
                <StarRating rating={Math.round(avgRating)} size="h-5 w-5" />
                <span className="text-sm text-muted-foreground">out of 5</span>
              </div>
              {/* Right — breakdown bars */}
              <div className="space-y-2 py-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingBar
                    key={star}
                    star={star}
                    count={ratingBreakdown[star] || 0}
                    total={reviews.length}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Write-a-review form */}
          {showReviewForm && (
            <div className="bg-card rounded-2xl border border-border shadow-card p-6 mb-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-foreground">Your Review</h3>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Star picker */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Overall Rating
                </label>
                <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      className="p-1 group"
                    >
                      <Star
                        className={`h-7 w-7 transition-all duration-100 ${
                          star <= (hoverRating || reviewRating)
                            ? 'text-amber-400 fill-amber-400 scale-110'
                            : 'text-muted-foreground/40 group-hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  {(hoverRating || reviewRating) > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground self-center">
                      {RATING_LABELS[hoverRating || reviewRating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Content textarea */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Share your experience
                </label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  rows={5}
                  placeholder="What did you love (or not love) about this product? Share details that would help other shoppers…"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none text-sm"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">Min. 10 characters</span>
                  <span
                    className={`text-xs tabular-nums ${reviewContent.length < 10 ? 'text-muted-foreground' : 'text-emerald-500'}`}
                  >
                    {reviewContent.trim().length} chars
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || reviewContent.trim().length < 10}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {submittingReview ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submittingReview ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          )}

          {/* Reviews list */}
          {reviewsLoading && reviews.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-card rounded-2xl border border-border text-center px-4">
              <Star className="h-12 w-12 text-muted-foreground opacity-20 mb-3" />
              <p className="font-semibold text-foreground mb-1">No reviews yet</p>
              <p className="text-sm text-muted-foreground">
                Be the first to share your thoughts about this product.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const initials = (review.user?.fullName || 'A')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const reviewDate = new Date(review.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <div
                    key={review._id}
                    className="bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        {review.user?.profilePicture ? (
                          <img
                            src={review.user.profilePicture}
                            alt={review.user.fullName}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-primary">{initials}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                          <div>
                            <span className="font-semibold text-foreground text-sm">
                              {review.user?.fullName || 'Anonymous'}
                            </span>
                            {review.isVerifiedPurchase && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {reviewDate}
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-2 mb-3">
                          <StarRating rating={review.rating} />
                          <span className="text-xs font-medium text-muted-foreground">
                            {RATING_LABELS[review.rating]}
                          </span>
                        </div>

                        {/* Content */}
                        <p className="text-sm text-foreground leading-relaxed">{review.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load more */}
              {reviewPagination && reviewPagination.page < reviewPagination.pages && (
                <button
                  onClick={() => fetchReviews(reviewPagination.page + 1)}
                  disabled={reviewsLoading}
                  className="w-full py-3 text-sm font-medium text-primary border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {reviewsLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" /> Loading…
                    </span>
                  ) : (
                    `Load more reviews (${reviewPagination.total - reviews.length} remaining)`
                  )}
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
