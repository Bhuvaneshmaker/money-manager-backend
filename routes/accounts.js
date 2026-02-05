const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Account = require('../models/Account');

// Validation middleware
const validateAccount = [
  body('name').notEmpty().trim().withMessage('Account name is required'),
  body('type')
    .isIn(['savings', 'checking', 'cash', 'credit', 'investment'])
    .withMessage('Invalid account type'),
  body('balance').optional().isFloat({ min: 0 }).withMessage('Balance must be a positive number'),
];

const validateObjectId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid account ID' });
  }
  return next();
};

// @route   GET /api/accounts
// @desc    Get all accounts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find().sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/accounts/:id
// @desc    Get account by ID
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/accounts
// @desc    Create new account
// @access  Public
router.post('/', validateAccount, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, balance, currency, description } = req.body;
    const parsedBalance = balance !== undefined ? Number(balance) : 0;
    if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
      return res.status(400).json({ message: 'Balance must be a positive number' });
    }

    const account = new Account({
      name,
      type,
      balance: parsedBalance,
      currency: currency || 'INR',
      description,
    });

    const savedAccount = await account.save();
    res.status(201).json(savedAccount);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/accounts/:id
// @desc    Update account
// @access  Public
router.put('/:id', validateObjectId, validateAccount, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const { name, type, balance, currency, description } = req.body;
    const parsedBalance =
      balance !== undefined ? Number(balance) : account.balance;
    if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
      return res.status(400).json({ message: 'Balance must be a positive number' });
    }

    account.name = name;
    account.type = type;
    account.balance = parsedBalance;
    account.currency = currency || account.currency;
    account.description = description;

    const updatedAccount = await account.save();
    res.json(updatedAccount);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   DELETE /api/accounts/:id
// @desc    Delete account
// @access  Public
router.delete('/:id', validateObjectId, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await Account.findByIdAndDelete(req.params.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/accounts/transfer
// @desc    Transfer money between accounts
// @access  Public
router.post('/transfer', async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount } = req.body;

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ 
        message: 'From account, to account, and amount are required' 
      });
    }

    if (
      !mongoose.isValidObjectId(fromAccountId) ||
      !mongoose.isValidObjectId(toAccountId)
    ) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    const fromAccount = await Account.findById(fromAccountId);
    const toAccount = await Account.findById(toAccountId);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ message: 'One or both accounts not found' });
    }

    if (fromAccount.balance < parsedAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    fromAccount.balance -= parsedAmount;
    toAccount.balance += parsedAmount;

    await fromAccount.save();
    await toAccount.save();

    res.json({
      message: 'Transfer successful',
      fromAccount,
      toAccount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
