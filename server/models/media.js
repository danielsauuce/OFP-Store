// Media.js (For images)
import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    secureUrl: { type: String },
    publicId: { type: String, unique: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
  },
  { timestamps: true },
);

mediaSchema.index({ publicId: 1 }, { unique: true });

export default mongoose.model('Media', mediaSchema);
