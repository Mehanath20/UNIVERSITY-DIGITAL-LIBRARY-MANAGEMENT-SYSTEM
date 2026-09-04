import mongoose from 'mongoose';

const membershipPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true
    },
    memberType: {
      type: String,
      enum: ['STUDENT', 'FACULTY'],
      required: [true, 'Member type is required'],
      unique: true,
      index: true
    },
    maxBooksAllowed: {
      type: Number,
      required: [true, 'Max books allowed is required'],
      min: [1, 'Max books allowed must be at least 1'],
      default: 3
    },
    loanDurationDays: {
      type: Number,
      required: [true, 'Loan duration in days is required'],
      min: [1, 'Loan duration must be at least 1 day'],
      default: 14
    },
    finePerDay: {
      type: Number,
      required: [true, 'Fine per day is required'],
      min: [0, 'Fine per day cannot be negative'],
      default: 5
    },
    maxFine: {
      type: Number,
      default: 500,
      min: [0, 'Max fine cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const MembershipPlan = mongoose.model('MembershipPlan', membershipPlanSchema);
export default MembershipPlan;
