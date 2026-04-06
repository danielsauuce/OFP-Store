import { useState, useEffect, useCallback } from 'react';
import { Star, Trash2, Eye, EyeOff, Loader, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAllReviewsAdminService,
  toggleReviewVisibilityService,
  deleteReviewAdminService,
} from '../../services/reviewService';
import Pagination from './components/Pagination';

const STAR_LABELS = { 5: 'Excellent', 4: 'Very Good', 3: 'Average', 2: 'Poor', 1: 'Terrible' };

const StarDisplay = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`h-3.5 w-3.5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
      />
    ))}
  </div>
);

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all'); // all | visible | hidden
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter === 'visible') params.approved = 'true';
      if (filter === 'hidden') params.approved = 'false';

      const data = await getAllReviewsAdminService(params);
      if (data?.success) {
        setReviews(data.reviews);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggleVisibility = async (review) => {
    setActionLoading(review._id);
    try {
      const data = await toggleReviewVisibilityService(review._id, !review.isApproved);
      if (data?.success) {
        setReviews((prev) =>
          prev.map((r) => (r._id === review._id ? { ...r, isApproved: !r.isApproved } : r)),
        );
        toast.success(data.message);
      }
    } catch {
      toast.error('Failed to update review visibility');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId) => {
    setActionLoading(reviewId);
    setDeleteConfirm(null);
    try {
      const data = await deleteReviewAdminService(reviewId);
      if (data?.success) {
        setReviews((prev) => prev.filter((r) => r._id !== reviewId));
        setPagination((prev) => (prev ? { ...prev, total: prev.total - 1 } : prev));
        toast.success('Review deleted');
      }
    } catch {
      toast.error('Failed to delete review');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = search.trim()
    ? reviews.filter(
        (r) =>
          r.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          r.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
          r.content?.toLowerCase().includes(search.toLowerCase()),
      )
    : reviews;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination?.total ?? 0} total reviews
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by user, product or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
          {['all', 'visible', 'hidden'].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`px-4 py-2 transition-colors capitalize ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Star className="h-12 w-12 text-muted-foreground opacity-20 mb-3" />
            <p className="font-semibold text-foreground">No reviews found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Rating
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide max-w-xs">
                    Review
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((review) => (
                  <tr key={review._id} className="hover:bg-muted/30 transition-colors">
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {review.user?.fullName || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">{review.user?.email}</div>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">
                        {review.product?.name || '—'}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      <StarDisplay rating={review.rating} />
                      <span className="text-xs text-muted-foreground mt-0.5 block">
                        {STAR_LABELS[review.rating]}
                      </span>
                    </td>

                    {/* Content */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-foreground line-clamp-2 text-sm">{review.content}</p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          review.isApproved
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${review.isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        />
                        {review.isApproved ? 'Visible' : 'Hidden'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVisibility(review)}
                          disabled={actionLoading === review._id}
                          title={review.isApproved ? 'Hide review' : 'Restore review'}
                          className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                            review.isApproved
                              ? 'border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                              : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                          }`}
                        >
                          {actionLoading === review._id ? (
                            <Loader className="h-3.5 w-3.5 animate-spin" />
                          ) : review.isApproved ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(review._id)}
                          disabled={actionLoading === review._id}
                          title="Delete review"
                          className="p-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Pagination currentPage={page} totalPages={pagination.pages} onPageChange={setPage} />
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Review</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
