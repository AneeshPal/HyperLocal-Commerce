
import express from "express";
import mongoose from "mongoose";
import authMiddleware from "../middleware/auth.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";
import Listing from "../models/Listing.js";
import { createTransaction } from "../services/transactionService.js";

const router = express.Router();

// Notification failures must not undo a successful transaction update.
async function createNotification(data) {
  try {
    await Notification.create(data);
  } catch (error) {
    console.error("Create notification error:", error);
  }
}

// Create a transaction and notify the seller.
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { listingId } = req.body;

    if (
      typeof listingId !== "string" ||
      !mongoose.isValidObjectId(listingId)
    ) {
      return res.status(400).json({
        message: "A valid listingId is required.",
      });
    }

    const transaction = await createTransaction({
      listingId,
      buyerId: req.user,
    });

    // A transaction is not proof of payment.
    await createNotification({
      user: transaction.seller,
      type: "order_created",
      title: "New order received",
      message: "A buyer has placed an order for your listing. Open Orders to review it. Payment is not yet confirmed.",
      relatedListing: transaction.listing,
      relatedTransaction: transaction._id,
    });

    return res.status(201).json({
      message: "Transaction created. Payment has not been made.",
      transaction: {
        id: transaction._id,
        listing: transaction.listing,
        buyer: transaction.buyer,
        seller: transaction.seller,
        amountPaise: transaction.amountPaise,
        currency: transaction.currency,
        paymentStatus: transaction.paymentStatus,
        fulfilmentStatus: transaction.fulfilmentStatus,
        resolutionStatus: transaction.resolutionStatus,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    if (error.message === "Listing not found.") {
      return res.status(404).json({ message: error.message });
    }

    if (
      error.message === "You cannot purchase your own listing." ||
      error.message === "Listing has an invalid price." ||
      error.message === "Listing price must be a valid INR amount." ||
      error.message === "Invalid listing or buyer ID."
    ) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Create transaction error:", error);
    return res.status(500).json({
      message: "Failed to create transaction.",
    });
  }
});

// Get transactions belonging to the logged-in buyer or seller.
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ buyer: req.user }, { seller: req.user }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("listing", "title price images");

    return res.json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error);
    return res.status(500).json({
      message: "Failed to fetch transactions.",
    });
  }
});

// Seller marks a paid transaction as delivered.
router.post("/:id/delivered", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid transaction ID." });
    }

    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: id,
        seller: req.user,
        paymentStatus: "paid",
        fulfilmentStatus: { $in: ["not_started", "in_progress"] },
        resolutionStatus: "none",
      },
      {
        $set: { fulfilmentStatus: "delivered" },
        $push: {
          events: {
            type: "item_marked_delivered",
            actorId: req.user,
            note: "Seller marked the item as delivered.",
          },
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!transaction) {
      return res.status(409).json({
        message:
          "Transaction cannot be marked delivered. Check the payment, status, and seller account.",
      });
    }

    await createNotification({
      user: transaction.buyer,
      type: "order_delivered",
      title: "Order marked as delivered",
      message:
        "The seller has marked your order as delivered. Please confirm receipt when you have received it.",
      relatedListing: transaction.listing,
      relatedTransaction: transaction._id,
    });

    return res.json({
      message: "Item marked as delivered.",
      transaction,
    });
  } catch (error) {
    console.error("Mark delivered error:", error);
    return res.status(500).json({
      message: "Failed to update delivery status.",
    });
  }
});

// Buyer confirms receipt.
router.post("/:id/confirm-receipt", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid transaction ID.",
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: id,
        buyer: req.user,
        paymentStatus: "paid",
        fulfilmentStatus: "delivered",
        resolutionStatus: "none",
      },
      {
        $set: { resolutionStatus: "release_eligible" },
        $push: {
          events: {
            type: "buyer_confirmed_receipt",
            actorId: req.user,
            note: "Buyer confirmed receipt of the item.",
          },
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!transaction) {
      return res.status(409).json({
        message:
          "Receipt cannot be confirmed. The item must be delivered and no dispute can be open.",
      });
    }

    await createNotification({
      user: transaction.seller,
      type: "receipt_confirmed",
      title: "Buyer confirmed receipt",
      message:
        "The buyer confirmed receipt. The transaction is eligible for settlement review; funds have not necessarily been released.",
      relatedListing: transaction.listing,
      relatedTransaction: transaction._id,
    });

    return res.json({
      message:
        "Receipt confirmed. Transaction is eligible for settlement review.",
      transaction,
    });
  } catch (error) {
    console.error("Confirm receipt error:", error);
    return res.status(500).json({
      message: "Failed to confirm receipt.",
    });
  }
});

// Buyer opens a dispute.
router.post("/:id/dispute", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid transaction ID." });
    }

    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        message: "A dispute reason is required.",
      });
    }

    const disputeReason = reason.trim();

    if (disputeReason.length > 1000) {
      return res.status(400).json({
        message: "Dispute reason must be 1000 characters or fewer.",
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: id,
        buyer: req.user,
        paymentStatus: "paid",
        resolutionStatus: { $in: ["none", "release_eligible"] },
        fulfilmentStatus: { $ne: "cancelled" },
      },
      {
        $set: { resolutionStatus: "disputed" },
        $push: {
          events: {
            type: "dispute_opened",
            actorId: req.user,
            note: disputeReason,
          },
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!transaction) {
      return res.status(409).json({
        message:
          "A dispute cannot be opened for this transaction in its current state.",
      });
    }

    await createNotification({
      user: transaction.seller,
      type: "dispute_opened",
      title: "Dispute opened",
      message: `The buyer has opened a dispute. Reason: ${disputeReason}`,
      relatedListing: transaction.listing,
      relatedTransaction: transaction._id,
    });

    return res.json({
      message: "Dispute opened successfully.",
      transaction,
    });
  } catch (error) {
    console.error("Open dispute error:", error);
    return res.status(500).json({
      message: "Failed to open dispute.",
    });
  }
});

export default router;
