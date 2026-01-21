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
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
      required: true,
      enum: ['Sofas', 'Tables', 'Chairs', 'Beds', 'Storage', 'Lighting', 'Decor'],
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
  {
    timestamps: true,
  },
);

// Indexes
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ inStock: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Pre-save hook to update inStock based on stockQuantity
productSchema.pre('save', function (next) {
  this.inStock = this.stockQuantity > 0;
  next();
});

export default mongoose.model('Product', productSchema);
