import express from "express";
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import Message from "./models/Message.js";

import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listing.js";
import conversationRoutes from "./routes/conversation.js";
import messageRoutes from "./routes/message.js";

import authMiddleware from "./middleware/auth.js";


const app = express();

const PORT = 8080;


// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());

app.use(express.json());


// ===============================
// API ROUTES
// ===============================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/listings",
    listingRoutes
);

app.use(
    "/api/conversations",
    conversationRoutes
);

app.use(
    "/api/messages",
    messageRoutes
);


// ===============================
// PROTECTED TEST ROUTE
// ===============================

app.get(
    "/api/protected",
    authMiddleware,
    (req, res) => {

        res.json({
            message:
                "You accessed a protected route",

            userId:
                req.user
        });

    }
);


// ===============================
// BASIC TEST ROUTE
// ===============================

app.get(
    "/commerce",
    (req, res) => {

        res.send(
            "API working"
        );

    }
);


// ===============================
// HTTP SERVER
// ===============================

const httpServer =
    http.createServer(app);


// ===============================
// SOCKET.IO
// ===============================

const io =
    new Server(
        httpServer,
        {
            cors: {
                origin:
                    "http://localhost:5173",

                methods: [
                    "GET",
                    "POST"
                ]
            }
        }
    );


// ===============================
// SOCKET CONNECTION
// ===============================

io.on(
    "connection",
    (socket) => {

        console.log(
            "User connected:",
            socket.id
        );


        // ===============================
        // JOIN CONVERSATION
        // ===============================

        socket.on(
            "joinConversation",
            (conversationId) => {

                socket.join(
                    conversationId
                );

                console.log(
                    `Socket ${socket.id} joined conversation ${conversationId}`
                );

            }
        );


        // ===============================
        // SEND MESSAGE
        // ===============================

        socket.on(
            "sendMessage",
            async (message) => {

                try {
                    const newMessage =
                        await Message.create({
                            conversation:
                                message.conversationId,

                            sender:
                                message.sender,

                            text:
                                message.text
                        });


                    // Send message to everyone
                    // inside this conversation

                    io.to(
                        message.conversationId
                    ).emit(
                        "receiveMessage",
                        newMessage
                    );


                } catch (error) {

                    console.error(
                        "Message save error:",
                        error
                    );

                }

            }
        );


        // ===============================
        // DISCONNECT
        // ===============================

        socket.on(
            "disconnect",
            () => {

                console.log(
                    "User disconnected:",
                    socket.id
                );

            }
        );

    }
);


// ===============================
// DATABASE CONNECTION
// ===============================

const dbConnect =
    async () => {

        try {

            await mongoose.connect(
                process.env.MONGO_URI
            );


            console.log(
                "Safely Connected With MongoDB Atlas"
            );


            console.log(
                "Database name:",
                mongoose.connection.name
            );


            // Start server only after
            // MongoDB connection succeeds

            httpServer.listen(
                PORT,
                () => {

                    console.log(
                        `App is listening on port ${PORT}`
                    );

                }
            );


        } catch (error) {

            console.log(
                "Some Error occurred while connecting with MongoDB Atlas",
                error
            );

        }

    };


dbConnect();