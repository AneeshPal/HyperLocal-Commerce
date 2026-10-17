
import express from "express";
import crypto from "crypto";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// IMPORTANT: this route must receive the raw request body.
router.post("/", async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.get("X-Razorpay-Signature");

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is missing.");
      return res.sendStatus(500);
    }

    if (!Buffer.isBuffer(req.body) || !signature) {
      return res.sendStatus(400);
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    if (!/^[a-f0-9]{64}$/i.test(signature)) {
      return res.sendStatus(400);
    }

    const received = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.sendStatus(400);
    }

    const event = JSON.parse(req.body.toString("utf8"));

    // We only update successful, captured payments here.
    if (event.event !== "payment.captured") {
      return res.sendStatus(200);
    }

    const payment = event.payload?.payment?.entity;

    if (
      !payment?.id ||
      !payment.order_id ||
      !Number.isSafeInteger(payment.amount) ||
      !payment.currency ||
      payment.status !== "captured"
    ) {
      return res.sendStatus(400);
    }

    const transaction = await Transaction.findOne({
      provider: "razorpay",
      providerOrderId: payment.order_id,
    });

    // Unknown orders should be investigated rather than acknowledged
    // as successfully processed.
    if (!transaction) {
      console.error("Webhook order not found:", payment.order_id);
      return res.sendStatus(404);
    }

    // Verify the payment matches the expected transaction.
    if (
      payment.amount !== transaction.amountPaise ||
      payment.currency !== transaction.currency
    ) {
      console.error("Webhook payment details mismatch:", payment.id);
      return res.sendStatus(400);
    }

    // Duplicate delivery of the same captured payment is safe.
    if (transaction.paymentStatus === "paid") {
      if (transaction.providerPaymentId === payment.id) {
        return res.sendStatus(200);
      }

      console.error("Different payment for an already-paid transaction.");
      return res.sendStatus(409);
    }

    if (transaction.paymentStatus !== "pending") {
      return res.sendStatus(200);
    }

    const updated = await Transaction.findOneAndUpdate(
      {
        _id: transaction._id,
        paymentStatus: "pending",
        provider: "razorpay",
        providerOrderId: payment.order_id,
      },
      {
        $set: {
          paymentStatus: "paid",
          providerPaymentId: payment.id,
        },
        $push: {
          events: {
            type: "payment_captured",
            actorId: transaction.buyer,
            note: "Payment capture confirmed by Razorpay webhook.",
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      // Another request may have verified this payment concurrently.
      const latest = await Transaction.findById(transaction._id);

      if (
        latest?.paymentStatus === "paid" &&
        latest.providerPaymentId === payment.id
      ) {
        return res.sendStatus(200);
      }

      return res.sendStatus(409);
    }

    console.log("Webhook confirmed payment:", payment.id);
    return res.sendStatus(200);
  } catch (error) {
    console.error("Payment webhook error:", error);
    return res.sendStatus(500);
  }
});

export default router;
