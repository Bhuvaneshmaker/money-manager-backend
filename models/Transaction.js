const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      required: true,
      default: () => new mongoose.Types.ObjectId().toHexString(),
    },
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    division: {
      type: String,
      required: true,
      enum: ['personal', 'office'],
      default: 'personal',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ division: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
