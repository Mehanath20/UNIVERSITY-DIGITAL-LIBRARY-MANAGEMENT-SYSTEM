import mongoose from 'mongoose';

const holdSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book ID reference is required'],
      index: true
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member ID reference is required'],
      index: true
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    queuePosition: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['WAITING', 'NOTIFIED', 'FULFILLED', 'CANCELLED', 'EXPIRED'],
      default: 'WAITING',
      index: true
    },
    fulfilledAt: {
      type: Date
    },
    expiresAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate active holds
holdSchema.index({ bookId: 1, memberId: 1, status: 1 });

const Hold = mongoose.model('Hold', holdSchema);
export default Hold;
