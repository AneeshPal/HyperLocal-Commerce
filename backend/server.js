
import "dotenv/config";

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import Message from "./models/Message.js";

import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listing.js";
import conversationRoutes from "./routes/conversation.js";
import messageRoutes from "./routes/message.js";
import transactionRoutes from "./routes/transactions.js";
import paymentRoutes from "./routes/payment.js";
import paymentWebhookRoutes from "./routes/paymentWebhook.js";

import authMiddleware from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware

app.use(cors());

// Mount the webhook BEFORE express.json().
// Razorpay signature verification needs the original bytes.
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

// HTTP server
const httpServer = http.createServer(app);

// Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Socket connections
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(
      `Socket ${socket.id} joined conversation ${conversationId}`
    );
  });

  socket.on("sendMessage", async (message) => {
    try {
      const newMessage = await Message.create({
        conversation: message.conversationId,
        sender: message.sender,
        text: message.text,
      });

      io.to(message.conversationId).emit(
        "receiveMessage",
        newMessage
      );
    } catch (error) {
      console.error("Message save error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
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
