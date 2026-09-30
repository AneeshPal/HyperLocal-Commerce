import mongoose from "mongoose";

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    condition: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    // Cloudinary image URLs
    images: {
        type: [String],
        default: []
    },

    // Matching Cloudinary public IDs
    imagePublicIds: {
        type: [String],
        default: []
    },

    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },

        coordinates: {
            type: [Number],
            required: true
        }
    },

    neighborhood: {
        type: String
    },

    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

listingSchema.index({
    location: "2dsphere"
});

const Listing = mongoose.model(
    "Listing",
    listingSchema
);

export default Listing;