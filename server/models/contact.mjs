import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const contactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['new', 'open', 'in_progress', 'resolved', 'closed'],
      default: 'new',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: [noteSchema],
  },
  {
    timestamps: true,
  },
);

// Indexes
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ user: 1 });

/**
 * Method to add a note to the ticket
 * @param {String} text - The note text
 * @param {ObjectId} userId - User adding the note
 * @param {String} [status] - Optional status update
 */
contactSchema.methods.addNote = async function (text, userId, status) {
  this.notes.push({ text, createdBy: userId });

  if (status && ['new', 'open', 'in_progress', 'resolved', 'closed'].includes(status)) {
    this.status = status;
  }

  return this.save();
};

export default mongoose.model('Contact', contactSchema);
