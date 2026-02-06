import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    provider: { type: String, required: true },
    intentId: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN' },
    lastFour: String,
    method: { type: String, enum: ['card', 'bank', 'mobile'] },
  },
  { timestamps: true },
);

paymentSchema.index({ order: 1 }, { unique: true });
paymentSchema.index({ status: 1 });

export default mongoose.model('Payment', paymentSchema);
