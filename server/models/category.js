import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    image: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.pre('save', function (next) {
  if (!this.slug)
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  next();
});

categorySchema.index({ order: 1 });

export default mongoose.model('Category', categorySchema);
