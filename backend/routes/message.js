import express from "express";

import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

import authMiddleware from "../middleware/auth.js";

const router = express.Router();


// ========================================
// GET MESSAGES FOR A CONVERSATION
// ========================================

router.get(
    "/:conversationId",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                conversationId
            } = req.params;


            // Find conversation

            const conversation =
                await Conversation.findById(
                    conversationId
                );


            if (!conversation) {

                return res.status(404).json({
                    message:
                        "Conversation not found"
                });

            }


            // Check that logged-in user
            // belongs to this conversation

            const isParticipant =
                conversation.participants.some(
                    (participant) =>
                        participant.toString() ===
                        req.user
                );


            if (!isParticipant) {

                return res.status(403).json({
                    message:
                        "You are not part of this conversation"
                });

            }


            // Get messages

            const messages =
                await Message.find({
                    conversation:
                        conversationId
                })
                .populate(
                    "sender",
                    "name email"
                )
                .sort({
                    createdAt: 1
                });


            res.json(messages);


        } catch (error) {

            console.error(
                "Get messages error:",
                error
            );


            res.status(500).json({
                message:
                    "Failed to fetch messages"
            });

        }

    }
);


export default router;