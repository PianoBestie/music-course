import crypto from 'crypto';
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

// Enhanced environment validation
const requiredEnvVars = [
  'INSTAMOJO_AUTH_TOKEN',
  'INSTAMOJO_SALT', // For webhook verification
  'FRONTEND_URL',
  'BACKEND_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  process.exit(1);
}

const INSTAMOJO_API = process.env.NODE_ENV === 'production' 
  ? 'https://api.instamojo.com/v2/' 
  : 'https://test.instamojo.com/v2/';

const app = express();

// Security middlewares
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});

// Verify Instamojo webhook signature
const verifyWebhook = (req) => {
  const signature = req.headers['x-instamojo-signature'];
  const hash = crypto.createHmac('sha1', process.env.INSTAMOJO_SALT)
    .update(JSON.stringify(req.body))
    .digest('hex');
  return signature === hash;
};

/**
 * Create payment order with 1-year access
 */
app.post('/api/create-payment-order', apiLimiter, async (req, res) => {
  try {
    const { userId, email, name } = req.body;

    const payload = {
      purpose: "Piano Course (1 Year Access)",
      amount: "599",
      buyer_name: name,
      email,
      redirect_url: `${process.env.FRONTEND_URL}/payment-success?uid=${userId}`,
      webhook_url: `${process.env.BACKEND_URL}/api/payment-webhook`,
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
    console.error('Payment creation failed:', {
      error: error.message,
      response: error.response?.data
    });
    res.status(500).json({ 
      success: false, 
      error: 'Payment processing failed' 
    });
  }
});

/**
 * Payment webhook with signature verification
 */
app.post('/api/payment-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!verifyWebhook(req)) {
      console.warn('Invalid webhook signature');
      return res.status(403).send('Forbidden');
    }

    const { payment_request_id, payment_id, status } = req.body;

    if (status !== 'Completed') {
      return res.status(200).send('OK');
    }

    // Additional verification
    const payment = await axios.get(
      `${INSTAMOJO_API}payment_requests/${payment_request_id}/`,
      { headers: { 'Authorization': `Bearer ${process.env.INSTAMOJO_AUTH_TOKEN}` } }
    );

    if (payment.data.payment_request.status === 'Completed') {
      const userId = payment.data.payment_request.metadata.userId;
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

      await setDoc(doc(db, 'users', userId), {
        paymentStatus: 'verified',
        paymentMethod: 'instamojo',
        accessExpires: expiresAt,
        paymentDetails: {
          paymentRequestId: payment_request_id,
          paymentId: payment_id,
          amount: payment.data.payment_request.amount,
          currency: 'INR',
          verifiedAt: new Date()
        }
      }, { merge: true });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).send('Error');
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// Server initialization
const PORT = process.env.PORT || 5006;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
}); 