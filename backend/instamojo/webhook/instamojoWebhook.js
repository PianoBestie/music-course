export const instamojoWebhook = async (req, res) => {
    try {
      const { payment_request_id, payment_id, status } = req.body;
  
      if (status !== 'Completed') {
        return res.status(200).send('OK'); // Ignore failed payments
      }
  
      // Verify payment via API (optional but recommended)
      const verifyResponse = await axios.get(
        `${INSTAMOJO_API}payment_requests/${payment_request_id}/`,
        { headers: { 'Authorization': `Bearer ${process.env.INSTAMOJO_AUTH_TOKEN}` } }
      );
  
      if (verifyResponse.data.payment_request.status === 'Completed') {
        const userId = verifyResponse.data.payment_request.metadata.userId;
        
        // Update Firestore (mark payment as complete)
        await setDoc(doc(db, 'users', userId), {
          paymentStatus: 'verified',
          paymentDetails: {
            paymentId: payment_id,
            amount: verifyResponse.data.payment_request.amount,
            currency: 'INR',
            method: 'instamojo'
          }
        }, { merge: true });
      }
  
      res.status(200).send('OK');
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send('Error');
    }
  };