import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
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
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Issuer (Staff) ID reference is required']
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true
    },
    returnDate: {
      type: Date
    },
    fine: {
      type: Number,
      default: 0,
      min: [0, 'Fine cannot be negative']
    },
    fineStatus: {
      type: String,
      enum: ['NONE', 'UNPAID', 'PARTIAL', 'PAID', 'WAIVED'],
      default: 'NONE',
      index: true
    },
    status: {
      type: String,
      enum: ['ISSUED', 'RETURNED', 'OVERDUE', 'LOST', 'DAMAGED'],
      default: 'ISSUED',
      index: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index for member borrowing lookup
transactionSchema.index({ memberId: 1, status: 1 });
transactionSchema.index({ bookId: 1, status: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
