import express from "express";

import Conversation from "../models/Conversation.js";
import Listing from "../models/Listing.js";

import authMiddleware from "../middleware/auth.js";

const router = express.Router();


// ======================================
// CREATE OR FIND CONVERSATION
// ======================================

router.post(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            const { listingId } = req.body;

            if (!listingId) {
                return res.status(400).json({
                    message: "listingId is required"
                });
            }


            // Find the listing

            const listing =
                await Listing.findById(listingId);

            if (!listing) {
                return res.status(404).json({
                    message: "Listing not found"
                });
            }


            // Seller of this listing

            const sellerId =
                listing.seller.toString();


            // Don't allow seller to message themselves

            if (sellerId === req.user) {
                return res.status(400).json({
                    message:
                        "You cannot start a conversation with yourself"
                });
            }


            // Check if conversation already exists

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


            // If it doesn't exist, create it

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


            // Return conversation

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


export default router;