// PaymentSuccess.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check payment status (optional)
    const checkPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentRequestId = urlParams.get('payment_request_id');
      
      // Verify payment (you can also rely on webhook)
      const response = await fetch(`/api/verify-payment?payment_request_id=${paymentRequestId}`);
      
      if (response.ok) {
        navigate('/dashboard'); // Redirect to app
      } else {
        navigate('/payment-failed');
      }
    };

    checkPayment();
  }, [navigate]);

  return <div>Processing your payment...</div>;
}