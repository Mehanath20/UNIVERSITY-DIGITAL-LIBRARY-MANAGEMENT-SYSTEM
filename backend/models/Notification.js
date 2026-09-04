import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member reference is required'],
      index: true
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    },
    type: {
      type: String,
      enum: ['OVERDUE_REMINDER', 'BOOK_AVAILABLE', 'HOLD_EXPIRING', 'FINE_REMINDER'],
      required: [true, 'Notification type is required']
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'READ'],
      default: 'SENT',
      index: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ memberId: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
