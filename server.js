const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Global error handlers to avoid silent crashes
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Initialize express app
const app = express();

// Basic security hardening
app.disable('x-powered-by');

// Connect to MongoDB
connectDB();

// Middleware
const rawOrigins = process.env.CORS_ORIGIN || '';
const allowedOrigins = rawOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = allowedOrigins.includes('*');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients
    if (allowAllOrigins || allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed for this origin'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/accounts', require('./routes/accounts'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Money Manager API',
    version: '1.0.0',
    endpoints: {
      transactions: '/api/transactions',
      accounts: '/api/accounts',
    },
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message && err.message.toLowerCase().includes('cors')) {
    return res.status(403).json({ message: 'CORS error: origin not allowed' });
  }
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
