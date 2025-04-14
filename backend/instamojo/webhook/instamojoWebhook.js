export const instamojoWebhook = async (req, res) => {
  try {
      const { payment_request_id, payment_id, status } = req.body;

      // Immediate response for non-completed payments (reduce API calls)
      if (status !== 'Completed') {
          return res.status(200).send('OK');
      }

      // 1. Verify payment via Instamojo API (mandatory for security)
      const verifyResponse = await axios.get(
          `${process.env.INSTAMOJO_BASE_URL}v2/payment_requests/${payment_request_id}/`,
          { 
              headers: { 
                  'Authorization': `Bearer ${process.env.INSTAMOJO_AUTH_TOKEN}` 
              } 
          }
      );

      // 2. Additional validation checks
      const paymentData = verifyResponse.data.payment_request;
      if (paymentData.status !== 'Completed' || paymentData.id !== payment_request_id) {
          return res.status(400).send('Invalid payment status');
      }

      // 3. Verify webhook signature (critical security step)
      const providedSignature = req.headers['x-instamojo-signature'];
      const generatedSignature = crypto
          .createHmac('sha256', process.env.INSTAMOJO_PRIVATE_SALT)
          .update(JSON.stringify(req.body))
          .digest('hex');

      if (providedSignature !== generatedSignature) {
          console.error("Signature verification failed");
          return res.status(403).send('Invalid signature');
      }

      // 4. Process valid payment
      const userId = paymentData.metadata?.userId;
      if (!userId) {
          return res.status(400).send('User ID missing');
      }

      // 5. Update Firestore (with transaction safety)
      const userRef = doc(db, 'users', userId);
      await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) throw "User not found";
          
          transaction.set(userRef, {
              paymentStatus: 'verified',
              lastUpdated: new Date(),
              paymentDetails: {
                  paymentId,
                  requestId: payment_request_id,
                  amount: paymentData.amount,
                  currency: paymentData.currency || 'INR',
                  method: 'instamojo',
                  completedAt: new Date()
              }
          }, { merge: true });
      });

      res.status(200).send('OK');
  } catch (error) {
      console.error("Webhook processing failed:", error);
      // Don't expose internal errors to caller
      res.status(500).send('Error');
  }
};