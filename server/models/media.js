import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    secureUrl: { type: String },
    publicId: { type: String, unique: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
    folder: { type: String, default: 'general' }, // Add this
    usedBy: [
      // ← ADD THIS FIELD
      {
        modelType: { type: String, enum: ['Product', 'Category'], required: true },
        modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model('Media', mediaSchema);
