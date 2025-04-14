import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Initialize environment variables
dotenv.config();

// ===========================================
// Environment Validation
// ===========================================
const requiredEnvVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'FRONTEND_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  process.exit(1);
}

// ===========================================
// Express Application Setup
// ===========================================
const app = express();

// ===========================================
// Enhanced CORS Configuration
// ===========================================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://pianobestie.github.io',
  'https://pianobestie.github.io/music-course',
  'http://localhost:3000', // For local development
  'http://localhost:5006'  // For local API testing
].filter(Boolean); // Remove any undefined/null values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowedOrigin => 
      origin.startsWith(allowedOrigin) || 
      origin === allowedOrigin
    )) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Blocked by CORS: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
}));

// ===========================================
// Security Middlewares
// ===========================================
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting
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

// ===========================================
// API Routes
// ===========================================
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    allowedOrigins
  });
});

// Payment routes
app.use('/create-razorpay-order', apiLimiter, (req, res) => {
  try {
    // Your Razorpay order creation logic here
    res.json({ success: true, order: {} });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use('/verify-payment', apiLimiter, (req, res) => {
  try {
    // Your payment verification logic here
    res.json({ success: true });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// Error Handlers
// ===========================================
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
  
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    success: false,
    error: err.message || 'Internal Server Error'
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
});

// ===========================================
// Server Initialization
// ===========================================
const PORT = process.env.PORT || 5006;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`
  🚀 Server running on http://${HOST}:${PORT}
  🔒 Environment: ${process.env.NODE_ENV || 'development'}
  🌐 Allowed Origins: ${allowedOrigins.join(', ')}
  ⏰ Started at: ${new Date().toISOString()}
  `);
});

// Handle process events
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

export default app;