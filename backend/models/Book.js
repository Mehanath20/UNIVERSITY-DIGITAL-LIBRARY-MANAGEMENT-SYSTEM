import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      index: true
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      index: true
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    publisher: {
      type: String,
      trim: true,
      default: ''
    },
    publicationYear: {
      type: Number,
      default: () => new Date().getFullYear()
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies count is required'],
      min: [0, 'Total copies cannot be negative'],
      default: 1
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies count is required'],
      min: [0, 'Available copies cannot be negative'],
      default: 1
    },
    lostCopies: {
      type: Number,
      min: [0, 'Lost copies cannot be negative'],
      default: 0
    },
    damagedCopies: {
      type: Number,
      min: [0, 'Damaged copies cannot be negative'],
      default: 0
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE', 'ARCHIVED'],
      default: 'AVAILABLE',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual property for issued copies
bookSchema.virtual('issuedCopies').get(function () {
  const issued = this.totalCopies - (this.availableCopies + (this.lostCopies || 0) + (this.damagedCopies || 0));
  return Math.max(0, issued);
});

// Ensure virtuals are serialized in JSON
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

// Pre-save hook to ensure status consistency
bookSchema.pre('save', function (next) {
  if (this.status !== 'ARCHIVED') {
    if (this.availableCopies > 0) {
      this.status = 'AVAILABLE';
    } else {
      this.status = 'UNAVAILABLE';
    }
  }
  next();
});

const Book = mongoose.model('Book', bookSchema);
export default Book;
