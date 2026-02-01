import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
    },
    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    material: {
      type: String,
    },
    dimensions: {
      type: String,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ inStock: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Automatically update inStock before save
productSchema.pre('save', function (next) {
  this.inStock = this.stockQuantity > 0;
  next();
});

// Update inStock if stockQuantity changes via update
productSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();

  // Direct $set update
  if (update.stockQuantity !== undefined || update.$set?.stockQuantity !== undefined) {
    const newQty = update.stockQuantity ?? update.$set.stockQuantity;
    if (update.$set) update.$set.inStock = newQty > 0;
    else update.inStock = newQty > 0;
  }

  // $inc update
  if (update.$inc?.stockQuantity) {
    const doc = await this.model.findOne(this.getQuery());
    const newQty = (doc.stockQuantity || 0) + update.$inc.stockQuantity;
    update.$set = update.$set || {};
    update.$set.inStock = newQty > 0;
  }

  next();
});

export default mongoose.model('Product', productSchema);
