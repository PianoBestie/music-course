import Instamojo from 'instamojo-nodejs';
import dotenv from 'dotenv';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';

dotenv.config();

Instamojo.setup(process.env.INSTAMOJO_API_KEY, process.env.INSTAMOJO_AUTH_TOKEN);
Instamojo.isSandboxMode(true); // Set to false in production

export const createPaymentOrder = async (req, res) => {
  try {
    const { amount, purpose, userId, email, name } = req.body;

    const paymentData = {
      purpose,
      amount,
      buyer_name: name,
      email,
      redirect_url: `${process.env.FRONTEND_URL}/payment-success`,
      webhook_url: `${process.env.BACKEND_URL}/api/instamojo/webhook`,
      allow_repeated_payments: false,
      send_email: true,
      send_sms: false,
      metadata: { userId }
    };

    const response = await Instamojo.createPaymentOrder(paymentData);

    res.json({
      success: true,
      payment_url: response.payment_request.longurl,
      payment_request_id: response.payment_request.id
    });

  } catch (error) {
    console.error('Instamojo order creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order'
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { payment_request_id, payment_id } = req.body;
    
    const response = await Instamojo.getPaymentOrderDetails(payment_request_id);
    
    if (response.payment_request.status !== "Completed") {
      return res.status(400).json({ 
        success: false,
        error: 'Payment not completed' 
      });
    }

    // Save to Firestore
    const userId = response.payment_request.metadata.userId;
    const userRef = doc(db, 'users', userId);
    
    await setDoc(userRef, {
      paymentStatus: 'verified',
      paymentMethod: 'instamojo',
      paymentDetails: {
        paymentRequestId: payment_request_id,
        paymentId: payment_id,
        amount: response.payment_request.amount,
        currency: 'INR',
        verifiedAt: new Date()
      },
      lastUpdated: new Date()
    }, { merge: true });

    return res.json({ 
      success: true, 
      paymentId: payment_id 
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Payment verification failed'
    });
  }
};