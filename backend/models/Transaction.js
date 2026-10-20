
import mongoose from "mongoose";

const transactionEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    note: {
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

const transactionSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      immutable: true,
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    // Store INR amounts as integer paise.
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Amount must be a safe integer in paise.",
      },
      immutable: true,
    },

    currency: {
      type: String,
      enum: ["INR"],
      default: "INR",
      immutable: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refund_pending",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    fulfilmentStatus: {
      type: String,
      enum: [
        "not_started",
        "in_progress",
        "dispatched",
        "delivered",
        "cancelled",
      ],
      default: "not_started",
    },

    resolutionStatus: {
      type: String,
      enum: [
        "none",
        "disputed",
        "release_eligible",
        "settlement_pending",
        "settled",
      ],
      default: "none",
    },

    provider: {
      type: String,
      default: null,
    },

    providerOrderId: {
      type: String,
      default: null,
    },

    providerPaymentId: {
      type: String,
      default: null,
    },

    events: {
      type: [transactionEventSchema],
      default: [],
    },
  },
  { timestamps: true }
);

transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ seller: 1, createdAt: -1 });

const Transaction = mongoose.model(
  "Transaction",
  transactionSchema
);

export default Transaction;
