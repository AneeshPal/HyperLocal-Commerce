import express from "express";
import Listing from "../models/Listing.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            title,
            price,
            category,
            condition,
            description,
            coordinates,
            neighborhood
        } = req.body;

        const listing = await Listing.create({
            title,
            price,
            category,
            condition,
            description,
            location: {
                type: "Point",
                coordinates
            },
            neighborhood,
            seller: req.user
        });

        res.status(201).json({
            message: "Listing created successfully",
            listing
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create listing"
        });
    }
});

export default router;