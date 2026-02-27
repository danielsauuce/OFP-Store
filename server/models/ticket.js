import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, minlength: 10 },
    status: {
      type: String,
      enum: ['new', 'open', 'in_progress', 'resolved', 'closed'],
      default: 'new',
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    replies: [replySchema],
  },
  { timestamps: true },
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ user: 1 });

export default mongoose.model('Ticket', ticketSchema);
