
import express from "express";
import Notification from "../models/Notification.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// GET /api/notifications
// Fetch the logged-in user's notifications.
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("relatedListing", "title")
      .populate("relatedTransaction", "status resolutionStatus");

    return res.json(notifications);
  } catch (error) {
    console.error("Fetch notifications error:", error);

    return res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user,
      isRead: false,
    });

    return res.json({ count });
  } catch (error) {
    console.error("Unread count error:", error);

    return res.status(500).json({
      message: "Failed to fetch unread count",
    });
  }
});

// PATCH /api/notifications/:id/read
// Mark one notification as read.
router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user,
      },
      {
        $set: { isRead: true },
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    return res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      message: "Failed to update notification",
    });
  }
});

// PATCH /api/notifications/read-all
// Mark all of the logged-in user's notifications as read.
router.patch("/read-all", authMiddleware, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        user: req.user,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    return res.json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      message: "Failed to update notifications",
    });
  }
});

export default router;
