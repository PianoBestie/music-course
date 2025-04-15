import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig.js';

// Initialize environment variables with validation
dotenv.config();

const validateEnvironment = () => {
  const requiredEnvVars = [
    'INSTAMOJO_AUTH_TOKEN',
    'INSTAMOJO_SALT',
    'FRONTEND_URL',
    'BACKEND_URL',
    'NODE_ENV'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (!['production', 'development'].includes(process.env.NODE_ENV)) {
    throw new Error('NODE_ENV must be either "production" or "development"');
  }
};

try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Constants
const INSTAMOJO_API = process.env.NODE_ENV === 'production' 
  ? 'https://api.instamojo.com/v2/' 
  : 'https://test.instamojo.com/v2/';

const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

// Initialize Express
const app = express();

// Security Middlewares
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cors({
  origin: [
    'https://pianobestie.github.io', 
    'https://pianobestie.github.io/music-course', 
    'https://music-course.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later'
});

// Utility Functions
const verifyWebhookSignature = (req) => {
  const signature = req.headers['x-instamojo-signature'];
  if (!signature) return false;

  const hash = crypto.createHmac('sha1', process.env.INSTAMOJO_SALT)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash));
};

const validatePaymentRequest = (data) => {
  const requiredFields = ['userId', 'email', 'name'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('Invalid email format');
  }
};

// API Endpoints

/**
 * @route POST /api/create-payment-order
 * @desc Creates a new payment order for 1-year access
 */
app.post('/api/create-payment-order', apiLimiter, async (req, res) => {
  try {
    validatePaymentRequest(req.body);
    const { userId, email, name } = req.body;

    // Check if user already has active subscription
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists() && userDoc.data().paymentStatus === 'verified') {
      return res.status(400).json({
        success: false,
        error: 'User already has an active subscription'
      });
    }

    const payload = {
      purpose: "Piano Bestie (1 Year Access)",
      amount: "599",
      buyer_name: name,
      email,
      redirect_url: `${process.env.FRONTEND_URL}/payment-success?uid=${userId}`,
      webhook_url: `${process.env.BACKEND_URL}/api/payment-webhook`,
      allow_repeated_payments: false,
      send_email: true,
      send_sms: false,
      metadata: { userId }
    };

    const response = await axios.post(`${INSTAMOJO_API}payment_requests/`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INSTAMOJO_AUTH_TOKEN}`
      },
      timeout: 10000 // 10 seconds timeout
    });

    // Log payment request creation
    await setDoc(doc(db, 'payment_requests', response.data.payment_request.id), {
      userId,
      status: 'created',
      amount: payload.amount,
      created_at: new Date(),
      payment_request_id: response.data.payment_request.id
    });

    return res.json({
      success: true,
      payment_url: response.data.payment_request.longurl,
      payment_request_id: response.data.payment_request.id
    });

  } catch (error) {
    console.error('Payment creation failed:', {
      error: error.message,
      stack: error.stack,
      ...(error.response && { responseData: error.response.data })
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || 'Payment processing failed';

    return res.status(statusCode).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

/**
 * @route POST /api/payment-webhook
 * @desc Handles Instamojo payment webhook notifications
 */
app.post('/api/payment-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(req)) {
      console.warn('Invalid webhook signature - possible forgery attempt');
      return res.status(403).send('Forbidden');
    }

    const { payment_request_id, payment_id, status } = req.body;

    // Only process completed payments
    if (status !== 'Completed') {
      return res.status(200).send('OK');
    }

    // Additional verification with Instamojo API
    const paymentResponse = await axios.get(
      `${INSTAMOJO_API}payment_requests/${payment_request_id}/`,
      { 
        headers: { 
          'Authorization': `Bearer ${process.env.INSTAMOJO_AUTH_TOKEN}` 
        },
        timeout: 5000
      }
    );

    const paymentData = paymentResponse.data.payment_request;

    // Double-check payment status
    if (paymentData.status !== 'Completed') {
      console.warn(`Payment ${payment_id} status mismatch: ${paymentData.status}`);
      return res.status(200).send('OK');
    }

    const userId = paymentData.metadata?.userId;
    if (!userId) {
      throw new Error('User ID not found in payment metadata');
    }

    const expiresAt = new Date(Date.now() + ONE_YEAR_IN_MS);

    // Update user record
    await setDoc(doc(db, 'users', userId), {
      paymentStatus: 'verified',
      paymentMethod: 'instamojo',
      accessExpires: expiresAt,
      paymentDetails: {
        paymentRequestId: payment_request_id,
        paymentId: payment_id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        verifiedAt: new Date()
      },
      lastUpdated: new Date()
    }, { merge: true });

    // Update payment request record
    await setDoc(doc(db, 'payment_requests', payment_request_id), {
      status: 'completed',
      completed_at: new Date(),
      payment_id
    }, { merge: true });

    console.log(`Successfully processed payment for user ${userId}`);
    return res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook processing failed:', {
      error: error.message,
      stack: error.stack,
      ...(error.response && { responseData: error.response.data })
    });
    return res.status(500).send('Internal Server Error');
  }
});

/**
 * @route GET /api/check-payment/:userId
 * @desc Checks payment status for a user
 */
app.get('/api/check-payment/:userId', apiLimiter, async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();
    return res.json({
      success: true,
      paymentStatus: userData.paymentStatus || 'pending',
      isVerified: userData.paymentStatus === 'verified',
      expiresAt: userData.accessExpires?.toDate()?.toISOString()
    });

  } catch (error) {
    console.error('Payment check failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check payment status'
    });
  }
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal Server Error',
    requestId: req.id
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Server Initialization
const PORT = process.env.PORT || 5006;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful Shutdown
const shutdown = (signal) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  shutdown('unhandledRejection');
});