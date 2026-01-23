import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
    },
    secureUrl: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    format: {
      type: String,
    },
    size: {
      type: Number,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    folder: {
      type: String,
      default: 'products',
    },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'raw'],
      default: 'image',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usedBy: [
      {
        modelType: {
          type: String,
          enum: ['Product', 'User', 'Category'],
        },
        modelId: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'usedBy.modelType',
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ 'usedBy.modelId': 1 });

export default mongoose.model('Media', mediaSchema);
