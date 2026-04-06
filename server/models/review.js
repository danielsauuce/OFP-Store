import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true, minlength: 10, maxlength: 1000 },
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, isApproved: 1 });

reviewSchema.statics.updateAverage = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), isApproved: true } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await mongoose.model('Product').findByIdAndUpdate(productId, {
    averageRating: stats[0] ? stats[0].avg : 0,
    reviewCount: stats[0] ? stats[0].count : 0,
  });
};

reviewSchema.post('save', function () {
  this.constructor.updateAverage(this.product);
});

reviewSchema.post('deleteOne', { document: true, query: false }, function () {
  this.constructor.updateAverage(this.product);
});

export default mongoose.model('Review', reviewSchema);
