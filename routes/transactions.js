const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

// Validation middleware
const validateTransaction = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').notEmpty().trim().withMessage('Description is required'),
  body('category').notEmpty().trim().withMessage('Category is required'),
  body('division').isIn(['personal', 'office']).withMessage('Division must be personal or office'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
];

const validateDateRange = [
  query('startDate').optional().isISO8601().withMessage('Invalid startDate').toDate(),
  query('endDate').optional().isISO8601().withMessage('Invalid endDate').toDate(),
];

const validateRequiredDateRange = [
  query('startDate').notEmpty().withMessage('startDate is required').isISO8601().toDate(),
  query('endDate').notEmpty().withMessage('endDate is required').isISO8601().toDate(),
];

const validateObjectId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid transaction ID' });
  }
  return next();
};

// @route   GET /api/transactions
// @desc    Get all transactions
// @access  Public
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/transactions/filter
// @desc    Get filtered transactions
// @access  Public
router.get('/filter', validateDateRange, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, category, division, startDate, endDate } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (division) filter.division = division;
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/transactions/summary
// @desc    Get transaction summary
// @access  Public
router.get('/summary', validateDateRange, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const transactions = await Transaction.find(filter);

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      categoryBreakdown: {},
      divisionBreakdown: { personal: 0, office: 0 },
      transactionCount: transactions.length,
    };

    transactions.forEach((transaction) => {
      if (transaction.type === 'income') {
        summary.totalIncome += transaction.amount;
      } else {
        summary.totalExpense += transaction.amount;
      }

      if (!summary.categoryBreakdown[transaction.category]) {
        summary.categoryBreakdown[transaction.category] = 0;
      }
      summary.categoryBreakdown[transaction.category] += transaction.amount;

      if (transaction.division) {
        summary.divisionBreakdown[transaction.division] += transaction.amount;
      }
    });

    summary.balance = summary.totalIncome - summary.totalExpense;

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/transactions/date-range
// @desc    Get transactions by date range
// @access  Public
router.get('/date-range', validateRequiredDateRange, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate } = req.query;

    const transactions = await Transaction.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get transaction by ID
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Public
router.post('/', validateTransaction, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, amount, description, category, division, date } = req.body;
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const txCategory = category ? String(category).toLowerCase() : undefined;
    const txDate = date ? new Date(date) : new Date();

    const transaction = new Transaction({
      type,
      amount: parsedAmount,
      description,
      category: txCategory,
      division,
      date: txDate,
    });

    const savedTransaction = await transaction.save();
    return res.status(201).json(savedTransaction);
  } catch (error) {
    // Log full error stack to server console for diagnosis
    console.error('Create transaction error:', error.stack || error);

    // Handle Mongoose validation errors with 400 response
    if (error.name === 'ValidationError') {
      const details = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));
      return res.status(400).json({ message: 'Validation failed', errors: details });
    }

    // Handle duplicate key / Mongo errors
    if (error.name === 'MongoError') {
      return res.status(500).json({ message: 'Database error', error: error.message });
    }

    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Public
router.put('/:id', validateObjectId, validateTransaction, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if transaction can be edited (within 12 hours)
    const hoursDiff = (new Date() - new Date(transaction.date)) / (1000 * 60 * 60);
    if (hoursDiff > 12) {
      return res.status(403).json({ 
        message: 'Cannot edit transaction after 12 hours' 
      });
    }

    const { type, amount, description, category, division, date } = req.body;
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    transaction.type = type;
    transaction.amount = parsedAmount;
    transaction.description = description;
    transaction.category = category ? String(category).toLowerCase() : transaction.category;
    transaction.division = division;
    transaction.date = date ? new Date(date) : transaction.date;

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Public
router.delete('/:id', validateObjectId, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if transaction can be deleted (within 12 hours)
    const hoursDiff = (new Date() - new Date(transaction.date)) / (1000 * 60 * 60);
    if (hoursDiff > 12) {
      return res.status(403).json({ 
        message: 'Cannot delete transaction after 12 hours' 
      });
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
