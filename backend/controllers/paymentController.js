// controllers/paymentController.js
import axios from 'axios';

const INSTAMOJO_API = 'https://test.instamojo.com/v2/'; // Sandbox URL

export const createInstamojoOrder = async (req, res) => {
  try {
    const { amount, purpose, userId, email, name } = req.body;

    const payload = {
      purpose,
      amount,
      buyer_name: name,
      email,
      redirect_url: `${process.env.FRONTEND_URL}/payment-success`, // After payment success
      webhook_url: `${process.env.BACKEND_URL}/api/instamojo/webhook`, // For payment verification
      allow_repeated_payments: false,
      metadata: { userId } // Store user ID for verification
    };

    const response = await axios.post(`${INSTAMOJO_API}payment_requests/`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INSTAMOJO_AUTH_TOKEN}`
      }
    });

    res.json({
      payment_url: response.data.payment_request.longurl, // Redirect user here
      payment_request_id: response.data.payment_request.id
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to create payment" });
  }
};