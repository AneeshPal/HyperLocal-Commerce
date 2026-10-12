import express from "express";

import Conversation from "../models/Conversation.js";
import Listing from "../models/Listing.js";
import Message from "../models/Message.js";

import authMiddleware from "../middleware/auth.js";

const router = express.Router();


// ========================================
// GET MY CONVERSATIONS
// ========================================

router.get(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            const conversations =
                await Conversation.find({
                    participants: req.user
                })
                .populate(
                    "participants",
                    "name email"
                )
                .populate(
                    "listing",
                    "title price images"
                )
                .sort({
                    createdAt: -1
                });


            res.json(
                conversations
            );


        } catch (error) {

            console.error(
                "Get conversations error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch conversations"
            });

        }

    }
);


// ========================================
// CREATE / FIND CONVERSATION
// ========================================

router.post(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                listingId
            } = req.body;


            if (!listingId) {

                return res.status(400).json({
                    message:
                        "listingId is required"
                });

            }


            const listing =
                await Listing.findById(
                    listingId
                );


            if (!listing) {

                return res.status(404).json({
                    message:
                        "Listing not found"
                });

            }


            const sellerId =
                listing.seller.toString();


            if (
                sellerId === req.user
            ) {

                return res.status(400).json({
                    message:
                        "You cannot start a conversation with yourself"
                });

            }


            let conversation =
                await Conversation.findOne({
                    participants: {
                        $all: [
                            req.user,
                            sellerId
                        ]
                    },
                    listing: listingId
                });


            if (!conversation) {

                conversation =
                    await Conversation.create({
                        participants: [
                            req.user,
                            sellerId
                        ],
                        listing: listingId
                    });

            }


            const populatedConversation =
                await Conversation.findById(
                    conversation._id
                )
                .populate(
                    "participants",
                    "name email"
                )
                .populate(
                    "listing",
                    "title price images"
                );


            res.json(
                populatedConversation
            );


        } catch (error) {

            console.error(
                "Conversation error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to create conversation"
            });

        }

    }
);

// ========================================
// DELETE A CONVERSATION AND ITS MESSAGES
// ========================================

router.delete(
    "/:id",
    authMiddleware,
    async (req, res) => {
        try {
            const conversation =
                await Conversation.findById(
                    req.params.id
                );

            if (!conversation) {
                return res.status(404).json({
                    message: "Conversation not found"
                });
            }

            const isParticipant =
                conversation.participants.some(
                    (participant) =>
                        participant.toString() ===
                        req.user
                );

            if (!isParticipant) {
                return res.status(403).json({
                    message:
                        "You cannot delete this conversation"
                });
            }

            // Delete messages belonging to this chat
            await Message.deleteMany({
                conversation: conversation._id
            });

            // Delete the conversation itself
            await conversation.deleteOne();

            return res.json({
                message:
                    "Conversation and messages deleted successfully"
            });

        } catch (error) {
            console.error(
                "Delete conversation error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to delete conversation"
            });
        }
    }
);

// ========================================
// GET ONE CONVERSATION
// ========================================

router.get(
    "/:id",
    authMiddleware,
    async (req, res) => {

        try {

            const conversation =
                await Conversation.findById(
                    req.params.id
                )
                .populate(
                    "participants",
                    "name email"
                )
                .populate(
                    "listing",
                    "title price images seller"
                );


            if (!conversation) {

                return res.status(404).json({
                    message:
                        "Conversation not found"
                });

            }


            const isParticipant =
                conversation.participants.some(
                    (participant) =>
                        participant._id.toString() ===
                        req.user
                );


            if (!isParticipant) {

                return res.status(403).json({
                    message:
                        "You are not part of this conversation"
                });

            }


            res.json(
                conversation
            );


        } catch (error) {

            console.error(
                "Get conversation error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch conversation"
            });

        }

    }
);


export default router;