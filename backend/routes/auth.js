import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";

dotenv.config();

const router = express.Router();

// SIGN UP
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, neighborhood } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const user = new User({
            name: name.trim(),
            email: normalizedEmail,
            password,
            neighborhood: neighborhood?.trim() || ""
        });

        await user.save();

        return res.status(201).json({
            message: "User registered successfully"
        });
    } catch (error) {
        console.error("Signup error:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
});

// LOG IN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                neighborhood: user.neighborhood || "",
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
});

// GET LOGGED-IN USER PROFILE
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.json({ user });
    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            message: "Failed to fetch profile"
        });
    }
});

export default router;