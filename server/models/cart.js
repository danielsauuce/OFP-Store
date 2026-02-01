// Cart.js
import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantSku: String, // If variations used
    quantity: { type: Number, min: 1, default: 1 },
    priceSnapshot: { type: Number, min: 0 },
    nameSnapshot: String,
    imageSnapshot: String,
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true },
);

cartSchema.virtual('total').get(function () {
  return this.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
});

cartSchema.set('toJSON', { virtuals: true });

cartSchema.index({ user: 1 }, { unique: true });

export default mongoose.model('Cart', cartSchema);
