
import express from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";

import authMiddleware from "../middleware/auth.js";
import Transaction from "../models/Transaction.js";
import { createPaymentOrder } from "../services/paymentService.js";

const router = express.Router();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error("Razorpay credentials are missing.");
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

// POST /api/payments/:transactionId/order
// Create or reuse a Razorpay order for the authenticated buyer.
router.post(
  "/:transactionId/order",
  authMiddleware,
  async (req, res) => {
    try {
      const { transactionId } = req.params;

      if (!mongoose.isValidObjectId(transactionId)) {
        return res.status(400).json({
          message: "Invalid transaction ID.",
        });
      }

      const order = await createPaymentOrder({
        transactionId,
        buyerId: req.user,
      });

      return res.status(200).json({
        message: "Payment order ready.",
        order,
        keyId,
      });
    } catch (error) {
      if (
        error.message ===
        "Pending transaction not found for this buyer."
      ) {
        return res.status(404).json({
          message: error.message,
        });
      }

      console.error("Payment order error:", error);

      return res.status(500).json({
        message: "Failed to create payment order.",
      });
    }
  }
);

// POST /api/payments/:transactionId/verify
// Verify the checkout signature and confirm the payment with Razorpay.
router.post(
  "/:transactionId/verify",
  authMiddleware,
  async (req, res) => {
    try {
      const { transactionId } = req.params;

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body ?? {};

      if (!mongoose.isValidObjectId(transactionId)) {
        return res.status(400).json({
          message: "Invalid transaction ID.",
        });
      }

      if (
        typeof razorpay_order_id !== "string" ||
        typeof razorpay_payment_id !== "string" ||
        typeof razorpay_signature !== "string" ||
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !/^[a-f0-9]{64}$/i.test(razorpay_signature)
      ) {
        return res.status(400).json({
          message: "Invalid or missing payment verification details.",
        });
      }

      const transaction = await Transaction.findOne({
        _id: transactionId,
        buyer: req.user,
        provider: "razorpay",
        providerOrderId: razorpay_order_id,
      });

      if (!transaction) {
        return res.status(404).json({
          message: "Transaction not found for this buyer and order.",
        });
      }

      // Idempotency: accept a repeat only for the same recorded payment.
      if (transaction.paymentStatus === "paid") {
        if (
          transaction.providerPaymentId === razorpay_payment_id
        ) {
          return res.status(200).json({
            message: "Payment already verified.",
            transactionId: transaction._id,
            paymentStatus: transaction.paymentStatus,
          });
        }

        return res.status(409).json({
          message: "Transaction was paid using a different payment.",
        });
      }

      if (transaction.paymentStatus !== "pending") {
        return res.status(409).json({
          message: "Transaction is not awaiting payment.",
          paymentStatus: transaction.paymentStatus,
        });
      }

      // Verify the HMAC signature using the server-side secret.
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

      const received = Buffer.from(
        razorpay_signature,
        "hex"
      );

      const expected = Buffer.from(
        expectedSignature,
        "hex"
      );

      if (
        received.length !== expected.length ||
        !crypto.timingSafeEqual(received, expected)
      ) {
        return res.status(400).json({
          message: "Invalid payment signature.",
        });
      }

      // Confirm the payment directly with Razorpay.
      const payment = await razorpay.payments.fetch(
        razorpay_payment_id
      );

      if (
        payment.id !== razorpay_payment_id ||
        payment.order_id !== razorpay_order_id ||
        payment.amount !== transaction.amountPaise ||
        payment.currency !== transaction.currency
      ) {
        return res.status(400).json({
          message: "Payment details do not match the transaction.",
        });
      }

      if (payment.status !== "captured") {
        return res.status(409).json({
          message: "Payment is not captured yet.",
          paymentStatus: payment.status,
        });
      }

      // Atomically change pending -> paid.
      // Concurrent verification requests cannot both win this update.
      const updated = await Transaction.findOneAndUpdate(
        {
          _id: transaction._id,
          buyer: req.user,
          paymentStatus: "pending",
          provider: "razorpay",
          providerOrderId: razorpay_order_id,
        },
        {
          $set: {
            paymentStatus: "paid",
            providerPaymentId: razorpay_payment_id,
          },
          $push: {
            events: {
              type: "payment_captured",
              actorId: req.user,
              note: "Payment capture confirmed with Razorpay.",
            },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updated) {
        // Another request may have completed verification first.
        const latest = await Transaction.findById(
          transaction._id
        );

        if (
          latest?.paymentStatus === "paid" &&
          latest.providerPaymentId === razorpay_payment_id
        ) {
          return res.status(200).json({
            message: "Payment already verified.",
            transactionId: latest._id,
            paymentStatus: latest.paymentStatus,
          });
        }

        return res.status(409).json({
          message: "Transaction status changed. Please refresh.",
        });
      }

      return res.status(200).json({
        message: "Payment verified successfully.",
        transactionId: updated._id,
        paymentStatus: updated.paymentStatus,
      });
    } catch (error) {
      console.error("Payment verification error:", error);

      return res.status(500).json({
        message: "Unable to verify payment right now.",
      });
    }
  }
);

export default router;
