
import express from "express";
import mongoose from "mongoose";
import authMiddleware from "../middleware/auth.js";
import Transaction from "../models/Transaction.js";
import { createTransaction } from "../services/transactionService.js";

const router = express.Router();

// Create a transaction for a listing.
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

    // Your existing listing routes use req.user as the user ID.
    const buyerId = req.user;

    const transaction = await createTransaction({
      listingId,
      buyerId,
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
    if (
      error.message === "Listing not found."
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error.message === "You cannot purchase your own listing." ||
      error.message === "Listing has an invalid price." ||
      error.message === "Listing price must be a valid INR amount." ||
      error.message === "Invalid listing or buyer ID."
    ) {
      return res.status(400).json({
        message: error.message,
      });
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
      $or: [
        { buyer: req.user },
        { seller: req.user },
      ],
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

export default router;
