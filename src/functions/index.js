/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const functions = require("firebase-functions");
const cors = require("cors");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

const corsHandler = cors({origin: true});

// Create Razorpay Order
exports.createRazorpayOrder = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const options = {
        amount: 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.status(200).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({error: "Failed to create order"});
    }
  });
});

// Verify Payment
exports.verifyPayment = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const {razorpay_payment_id, razorpay_order_id, razorpay_signature} = req.body;

    const crypto = require("crypto");
    const expectedSignature = crypto
        .createHmac("sha256", functions.config().razorpay.key_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.status(200).json({success: true});
    } else {
      res.status(400).json({success: false});
    }
  });
});