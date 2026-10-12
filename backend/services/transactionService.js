
import mongoose from "mongoose";
import Listing from "../models/Listing.js";
import Transaction from "../models/Transaction.js";

export async function createTransaction({
  listingId,
  buyerId,
}) {
  // 1. Validate IDs before querying MongoDB.
  if (
    !mongoose.isValidObjectId(listingId) ||
    !mongoose.isValidObjectId(buyerId)
  ) {
    throw new Error("Invalid listing or buyer ID.");
  }

  // 2. Find the listing.
  const listing = await Listing.findById(listingId);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  // 3. Prevent purchasing your own listing.
  if (listing.seller.toString() === buyerId.toString()) {
    throw new Error("You cannot purchase your own listing.");
  }

  // 4. Validate the price.
  const price = Number(listing.price);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Listing has an invalid price.");
  }

  // Convert rupees to paise and reject fractions of a paise.
  const amountPaise = Math.round(price * 100);

  if (
    !Number.isSafeInteger(amountPaise) ||
    Math.abs(price * 100 - amountPaise) > 0.000001
  ) {
    throw new Error("Listing price must be a valid INR amount.");
  }

  // 5. Create a pending transaction.
  const transaction = await Transaction.create({
    listing: listing._id,
    buyer: buyerId,
    seller: listing.seller,
    amountPaise,
    currency: "INR",
    paymentStatus: "pending",
    fulfilmentStatus: "not_started",
    resolutionStatus: "none",
    events: [
      {
        type: "transaction_created",
        actorId: buyerId,
        note: "Purchase initiated.",
      },
    ],
  });

  return transaction;
}
