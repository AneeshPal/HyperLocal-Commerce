
import "dotenv/config";

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";
import Notification from "./models/Notification.js";

import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listing.js";
import conversationRoutes from "./routes/conversation.js";
import messageRoutes from "./routes/message.js";
import transactionRoutes from "./routes/transactions.js";
import paymentRoutes from "./routes/payment.js";
import paymentWebhookRoutes from "./routes/paymentWebhook.js";
import notificationRoutes from "./routes/notifications.js";
import marketComparisonRoutes from "./routes/marketComparison.js";
import productReviewsRoutes from "./routes/productReviews.js";

import authMiddleware from "./middleware/auth.js";

const app = express();
 
const PORT = process.env.PORT || 8080;

app.use(cors());

// Keep the webhook before express.json() for signature verification.
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhookRoutes
);

app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/market-comparison", marketComparisonRoutes);
app.use("/api/product-reviews", productReviewsRoutes);


// Protected test route
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You accessed a protected route",
    userId: req.user,
  });
});

// Basic test route
app.get("/commerce", (req, res) => {
  res.send("API working");
});

// HTTP server and Socket.IO
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Authenticate Socket.IO using the same middleware as REST APIs.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  const fakeRequest = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };

  const fakeResponse = {
    status() {
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  let finished = false;

  const finish = (error) => {
    if (finished) return;
    finished = true;
    next(error);
  };

  try {
    const result = authMiddleware(fakeRequest, fakeResponse, () => {
      if (!fakeRequest.user) {
        return finish(new Error("Invalid authentication token"));
      }

      socket.data.userId = String(fakeRequest.user);
      finish();
    });

    if (result && typeof result.catch === "function") {
      result.catch(() => finish(new Error("Socket authentication failed")));
    }
  } catch {
    finish(new Error("Socket authentication failed"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;

  // Each user gets a private room for notifications.
  socket.join(`user:${userId}`);

  console.log("Authenticated user connected:", userId);

  socket.on("joinConversation", async (conversationId) => {
    try {
      if (!mongoose.isValidObjectId(conversationId)) return;

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) return;

      const isParticipant = conversation.participants.some(
        (participant) => String(participant) === userId
      );

      if (!isParticipant) {
        socket.emit("socketError", {
          message: "You cannot join this conversation.",
        });
        return;
      }

      socket.join(String(conversation._id));
    } catch (error) {
      console.error("Join conversation error:", error);
    }
  });

  socket.on("sendMessage", async (payload, acknowledge) => {
    const ack = typeof acknowledge === "function" ? acknowledge : () => {};

    try {
      const conversationId = payload?.conversationId;
      const text =
        typeof payload?.text === "string" ? payload.text.trim() : "";

      if (
        !mongoose.isValidObjectId(conversationId) ||
        !text ||
        text.length > 5000
      ) {
        return ack({
          ok: false,
          message: "A valid conversation and message are required.",
        });
      }

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return ack({ ok: false, message: "Conversation not found." });
      }

      const participantIds = conversation.participants.map(String);

      if (!participantIds.includes(userId)) {
        return ack({
          ok: false,
          message: "You are not a participant in this conversation.",
        });
      }

      // Always use the authenticated user as sender.
      // Never trust a sender ID supplied by the browser.
      const newMessage = await Message.create({
        conversation: conversation._id,
        sender: userId,
        text,
      });

      const messagePayload = {
        ...newMessage.toObject(),
        sender: userId,
      };

      io.to(String(conversation._id)).emit(
        "receiveMessage",
        messagePayload
      );

      // Persist and deliver a notification to each other participant.
      const recipients = participantIds.filter((id) => id !== userId);

      for (const recipientId of recipients) {
        try {
          const notification = await Notification.create({
            user: recipientId,
            type: "general",
            title: "New message received",
            message:
              text.length > 120 ? `${text.slice(0, 117)}...` : text,
            relatedListing: conversation.listing || null,
          });

          io.to(`user:${recipientId}`).emit("newNotification", {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
            relatedListing: notification.relatedListing,
          });
        } catch (notificationError) {
          // A notification failure should not undo a saved message.
          console.error("Create message notification error:", notificationError);
        }
      }

      ack({ ok: true, messageId: newMessage._id });
    } catch (error) {
      console.error("Send message error:", error);
      ack({ ok: false, message: "Failed to send message." });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
  });
});

// Database connection
async function dbConnect() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from backend .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Safely connected with MongoDB Atlas");
    console.log("Database name:", mongoose.connection.name);

    httpServer.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
}

dbConnect();
