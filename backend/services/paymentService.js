
import Razorpay from "razorpay";
import Transaction from "../models/Transaction.js";

if (
  !process.env.RAZORPAY_KEY_ID ||
  !process.env.RAZORPAY_KEY_SECRET
) {
  throw new Error("Razorpay test credentials are missing.");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function createPaymentOrder({
  transactionId,
  buyerId,
}) {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    buyer: buyerId,
    paymentStatus: "pending",
  });

  if (!transaction) {
    throw new Error(
      "Pending transaction not found for this buyer."
    );
  }

  // Reuse an existing provider order if one is already recorded.
  if (transaction.providerOrderId) {
    return {
      orderId: transaction.providerOrderId,
      amountPaise: transaction.amountPaise,
      currency: transaction.currency,
    };
  }

  const order = await razorpay.orders.create({
    amount: transaction.amountPaise,
    currency: transaction.currency,
    receipt: transaction._id.toString(),
    notes: {
      transactionId: transaction._id.toString(),
    },
  });

  transaction.provider = "razorpay";
  transaction.providerOrderId = order.id;

  transaction.events.push({
    type: "payment_order_created",
    actorId: buyerId,
    note: "Payment order created with provider.",
  });

  await transaction.save();

  return {
    orderId: order.id,
    amountPaise: order.amount,
    currency: order.currency,
  };
}
