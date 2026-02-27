import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    price: { type: Number, min: 0 },
    stockQuantity: { type: Number, min: 0, default: 0 },
    attributes: { type: Map, of: String },
  },
  { _id: false },
);

const dimensionsSchema = new mongoose.Schema(
  {
    width: Number,
    height: Number,
    depth: Number,
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 160 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    primaryImage: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    variants: [variantSchema],
    material: String,
    dimensions: dimensionsSchema,
    stockQuantity: { type: Number, min: 0, default: 0 },
    inStock: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

productSchema.pre('save', function (next) {
  // Generate slug if not present
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Update inStock status
  this.inStock = this.stockQuantity > 0 || this.variants.some((v) => v.stockQuantity > 0);

  next();
});

productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);
