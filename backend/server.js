import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();



// Validate essential environment variables
const requiredEnvVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'FRONTEND_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  process.exit(1);
}

// Initialize Express application
const app = express();

// ======================
// Security Middlewares
// ======================
app.use(helmet());
app.use(cors({
  origin:process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});

// ======================
// Body Parsing
// ======================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ======================
// Route Imports
// ======================
import createOrderRouter from './routes/create-razorpay-order.js';
import verifyPaymentRouter from './routes/verify-payment.js';
import signupRouter from './routes/signup.js';

// ======================
// API Routes
// ======================
app.use('/api/health', (req, res) => res.status(200).json({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  uptime: process.uptime()
}));

app.use('/api/signup', apiLimiter, signupRouter);
app.use('/api/create-razorpay-order', apiLimiter, createOrderRouter);
app.use('/api/verify-payment', apiLimiter, verifyPaymentRouter);

// ======================
// Error Handlers
// ======================
// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);
  
  const errorResponse = {
    success: false,
    error: 'Internal Server Error'
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.message = err.message;
    errorResponse.stack = err.stack;
  }

  res.status(500).json(errorResponse);
});

// ======================
// Server Initialization
// ======================
const PORT = process.env.PORT || 5006;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`
  🚀 Server running on http://${HOST}:${PORT}
  🔒 Environment: ${process.env.NODE_ENV || 'development'}
  🌐 Allowed Origins: ${process.env.FRONTEND_URL}
  ⏰ Started at: ${new Date().toISOString()}
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});