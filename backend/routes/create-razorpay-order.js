import dotenv from 'dotenv';
import express from 'express';
import Razorpay from 'razorpay';

// Load .env (ensure file is in project root)
dotenv.config();


const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// Create Order Endpoint
router.post('/', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    // Input validation
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }



    // Create order
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt || `order_${Date.now()}`,
      notes: notes || {},
      payment_capture: 1 // Auto-capture payments
    });

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID// Send key to frontend
    });

  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
});

export default router;