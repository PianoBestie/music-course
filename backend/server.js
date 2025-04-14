import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig.js';

// Initialize environment variables
dotenv.config();

// ===========================================
// Environment Validation
// ===========================================
const requiredEnvVars = ['INSTAMOJO_AUTH_TOKEN', 'FRONTEND_URL', 'BACKEND_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  process.exit(1);
}

// Instamojo API configuration
const INSTAMOJO_API = process.env.NODE_ENV === 'production' 
  ? 'https://api.instamojo.com/v2/' 
  : 'https://test.instamojo.com/v2/';

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
  'http://localhost:3000',
  'http://localhost:5006'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
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
  maxAge: 86400
}));

// ===========================================
// Security Middlewares
// ===========================================
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    allowedOrigins
  });
});

// Create Instamojo payment order
app.post('/api/create-insta-order', apiLimiter, async (req, res) => {
  try {
    const { amount, purpose, userId, email, name } = req.body;

    const payload = {
      purpose,
      amount,
      buyer_name: name,
      email,
      redirect_url: `${process.env.FRONTEND_URL}/payment-success`,
      webhook_url: `${process.env.BACKEND_URL}/api/instamojo/webhook`,
      allow_repeated_payments: false,
      metadata: { userId }
    };

    const response = await axios.post(`${INSTAMOJO_API}payment_requests/`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INSTAMOJO_AUTH_TOKEN}`
      }
    });

    res.json({
      success: true,
      payment_url: response.data.payment_request.longurl,
      payment_request_id: response.data.payment_request.id
    });

  } catch (error) {
    console.error('Instamojo order creation error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create payment order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Instamojo webhook for payment verification
app.post('/api/instamojo/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const { payment_request_id, payment_id, status } = req.body;

    if (status !== 'Completed') {
      return res.status(200).send('OK');
    }

    // Verify payment via API
    const verifyResponse = await axios.get(
      `${INSTAMOJO_API}payment_requests/${payment_request_id}/`,
      { headers: { 'Authorization': `Bearer ${process.env.INSTAMOJO_AUTH_TOKEN}` } }
    );

    if (verifyResponse.data.payment_request.status === 'Completed') {
      const userId = verifyResponse.data.payment_request.metadata.userId;
      
      await setDoc(doc(db, 'users', userId), {
        paymentStatus: 'verified',
        paymentMethod: 'instamojo',
        paymentDetails: {
          paymentRequestId: payment_request_id,
          paymentId: payment_id,
          amount: verifyResponse.data.payment_request.amount,
          currency: 'INR',
          verifiedAt: new Date()
        },
        lastUpdated: new Date()
      }, { merge: true });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send('Error');
  }
});

// ===========================================
// Error Handlers
// ===========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

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
  💳 Payment Processor: Instamojo (${INSTAMOJO_API})
  🌐 Allowed Origins: ${allowedOrigins.join(', ')}
  ⏰ Started at: ${new Date().toISOString()}
  `);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

export default app;