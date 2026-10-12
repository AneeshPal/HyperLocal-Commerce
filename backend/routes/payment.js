
import express from "express";
import mongoose from "mongoose";
import authMiddleware from "../middleware/auth.js";
import { createPaymentOrder } from "../services/paymentService.js";

const router = express.Router();

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

      return res.status(201).json({
        message: "Payment order created.",
        order,
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

export default router;
