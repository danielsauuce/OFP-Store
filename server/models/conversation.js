import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'active', 'closed'], default: 'pending' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    unreadByAdmin: { type: Number, default: 0 },
  },
  { timestamps: true },
);

conversationSchema.index({ status: 1, lastMessageAt: -1 });
conversationSchema.index({ userId: 1 });

export default mongoose.model('Conversation', conversationSchema);
