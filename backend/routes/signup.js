import express from 'express';
import Razorpay from 'razorpay';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: "rzp_test_vTXBgsrLhU2Mcg",
  key_secret: "EvbZaGDASiZwnvPdqRusiNL4"
});

router.post('/', async (req, res) => {
  try {
    const { name, email, password, plan } = req.body;

    // Basic validation
    if (!name || !email || !password || !plan) {
      return res.status(400).json({ 
        success: false,
        error: 'Name, email, password, and plan are required' 
      });
    }

    // Create Razorpay order based on the selected plan
    const planAmounts = {
      'basic': 100 * 100,    // ₹100 in paisa
      'standard': 300 * 100, // ₹300 in paisa
      'premium': 500 * 100   // ₹500 in paisa
    };

    const amount = planAmounts[plan.toLowerCase()];
    if (!amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid plan selected' 
      });
    }

    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: `signup_${email}_${Date.now()}`,
      notes: {
        name,
        email,
        plan
      }
    });

    res.json({
      success: true,
      message: 'Signup initiated successfully',
      user: { name, email, plan },
      order,
      razorpayKey: "rzp_test_vTXBgsrLhU2Mcg"
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Signup process failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;