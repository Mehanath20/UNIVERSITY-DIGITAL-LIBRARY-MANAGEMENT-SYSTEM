import mongoose from 'mongoose';

const finePaymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: [true, 'Transaction reference is required'],
      index: true
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member reference is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment amount cannot be negative']
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'ONLINE', 'CARD', 'MOCK'],
      default: 'MOCK'
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'WAIVED'],
      default: 'PAID',
      index: true
    },
    paidAt: {
      type: Date,
      default: Date.now
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    referenceNumber: {
      type: String,
      trim: true
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

const FinePayment = mongoose.model('FinePayment', finePaymentSchema);
export default FinePayment;
