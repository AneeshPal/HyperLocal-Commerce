import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({

    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    ],

    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const Conversation = mongoose.model(
    "Conversation",
    conversationSchema
);

export default Conversation;