import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';

// Load .env (ensure file is in project root)
dotenv.config();

const router = express.Router();


router.post('/', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;
    console.log("entered")
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256',process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid signature' 
      });
    }

    // Save to Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      paymentStatus: 'verified',
      paymentMethod: 'razorpay',
      paymentDetails: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        amount: 1,
        currency: 'INR',
        verifiedAt: new Date()
      },
      lastUpdated: new Date()
    }, { merge: true });

    return res.json({ success: true, paymentId: razorpay_payment_id });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;

