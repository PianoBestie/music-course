import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import http from 'http';
import https from 'https';
import dns from 'dns';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig.js';
import admin from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// DNS configuration for better reliability
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google DNS

const app = express();

// Trust proxy headers (essential for Render.com and rate limiting)
app.set('trust proxy', true);

// Security middlewares
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

// Rate limiting with proper proxy configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

// Configure Axios instance for Instamojo
const INSTAMOJO_API = process.env.NODE_ENV === 'production'
  ? 'https://api.instamojo.com/v2/'
  : 'https://test.instamojo.com/v2/';

const axiosInstance = axios.create({
  baseURL: INSTAMOJO_API,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.INSTAMOJO_AUTH_TOKEN}`
  },
  family: 4, // Force IPv4
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true })
});

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * Create payment order endpoint
 */
app.post('/api/create-payment-order', apiLimiter, authenticate, async (req, res) => {
  try {
    const { userId, email, name } = req.body;

    // Validate input
    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already has active subscription
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists() && userDoc.data().paymentStatus === 'verified') {
      return res.status(400).json({ error: 'User already has active subscription' });
    }

    // Create payment request payload
    const payload = {
      purpose: "Piano Bestie (1 Year Access)",
      amount: "599",
      buyer_name: name || "Customer",
      email,
      redirect_url: `${process.env.FRONTEND_URL}/payment-success?uid=${userId}`,
      webhook_url: `${process.env.BACKEND_URL}/api/payment-webhook`,
      allow_repeated_payments: false,
      send_email: true,
      metadata: { userId }
    };

    // Call Instamojo API
    const response = await axiosInstance.post('payment_requests/', payload);

    // Save payment request to Firestore
    await setDoc(doc(db, 'payment_requests', response.data.payment_request.id), {
      userId,
      status: 'created',
      amount: payload.amount,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      payment_request_id: response.data.payment_request.id
    });

    res.json({
      success: true,
      payment_url: response.data.payment_request.longurl,
      payment_request_id: response.data.payment_request.id
    });

  } catch (error) {
    console.error('Payment creation error:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      stack: error.stack
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || 'Payment processing failed';

    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

/**
 * Payment webhook handler
 */
app.post('/api/payment-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-instamojo-signature'];
    const hash = crypto.createHmac('sha1', process.env.INSTAMOJO_SALT)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (signature !== hash) {
      console.warn('Invalid webhook signature');
      return res.status(403).send('Forbidden');
    }

    const { payment_request_id, payment_id, status } = req.body;

    // Only process completed payments
    if (status !== 'Completed') {
      return res.status(200).send('OK');
    }

    // Verify payment with Instamojo API
    const paymentResponse = await axiosInstance.get(`payment_requests/${payment_request_id}/`);
    const paymentData = paymentResponse.data.payment_request;

    if (paymentData.status !== 'Completed') {
      console.warn(`Payment ${payment_id} status mismatch: ${paymentData.status}`);
      return res.status(200).send('OK');
    }

    const userId = paymentData.metadata?.userId;
    if (!userId) {
      throw new Error('User ID not found in payment metadata');
    }

    // Update user record
    await setDoc(doc(db, 'users', userId), {
      paymentStatus: 'verified',
      paymentMethod: 'instamojo',
      accessExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      paymentDetails: {
        paymentRequestId: payment_request_id,
        paymentId: payment_id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        verifiedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Update payment request record
    await setDoc(doc(db, 'payment_requests', payment_request_id), {
      status: 'completed',
      completed_at: admin.firestore.FieldValue.serverTimestamp(),
      payment_id
    }, { merge: true });

    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal Server Error' 
  });
});

// Start server
const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Instamojo API: ${INSTAMOJO_API}`);
});