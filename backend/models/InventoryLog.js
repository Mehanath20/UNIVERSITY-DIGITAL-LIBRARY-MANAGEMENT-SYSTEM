import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
      index: true
    },
    action: {
      type: String,
      enum: [
        'BOOK_ADDED',
        'BOOK_ISSUED',
        'BOOK_RETURNED',
        'BOOK_LOST',
        'BOOK_DAMAGED',
        'COPY_RESTORED',
        'COPY_ADJUSTED'
      ],
      required: [true, 'Action is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      default: 1
    },
    previousAvailableCopies: {
      type: Number,
      required: true
    },
    newAvailableCopies: {
      type: Number,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor reference is required']
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

inventoryLogSchema.index({ bookId: 1, createdAt: -1 });

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);
export default InventoryLog;
