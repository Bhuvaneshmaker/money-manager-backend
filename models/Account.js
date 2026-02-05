const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['savings', 'checking', 'cash', 'credit', 'investment'],
      default: 'savings',
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
