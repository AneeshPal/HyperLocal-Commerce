
import express from "express";
import Listing from "../models/Listing.js";
import authMiddleware from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// CREATE LISTING
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      price,
      category,
      condition,
      description,
      coordinates,
      neighborhood,
    } = req.body;

    const listing = await Listing.create({
      title,
      price,
      category,
      condition,
      description,
      location: {
        type: "Point",
        coordinates,
      },
      neighborhood,
      seller: req.user,
    });

    res.status(201).json({
      message: "Listing created successfully",
      listing,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create listing" });
  }
});

// GET LISTINGS
// No coordinates = all locations.
// Coordinates + radius = nearby listings.
router.get("/", async (req, res) => {
  try {
    const {
      longitude,
      latitude,
      radius,
      category,
      minPrice,
      maxPrice,
      search,
    } = req.query;

    const filters = {};

    // Category filter
    if (category && category !== "All") {
      filters.category = category;
    }

    // Price filters
    if (
      (minPrice !== undefined && minPrice !== "") ||
      (maxPrice !== undefined && maxPrice !== "")
    ) {
      filters.price = {};

      if (minPrice !== undefined && minPrice !== "") {
        const min = Number(minPrice);

        if (!Number.isFinite(min)) {
          return res.status(400).json({
            message: "Invalid minimum price",
          });
        }

        filters.price.$gte = min;
      }

      if (maxPrice !== undefined && maxPrice !== "") {
        const max = Number(maxPrice);

        if (!Number.isFinite(max)) {
          return res.status(400).json({
            message: "Invalid maximum price",
          });
        }

        filters.price.$lte = max;
      }
    }

    // Search title and description
    if (search && search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filters.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const hasLongitude =
      longitude !== undefined && longitude !== "";

    const hasLatitude =
      latitude !== undefined && latitude !== "";

    // ALL LOCATIONS: GPS is not required
    if (!hasLongitude && !hasLatitude) {
      const listings = await Listing.find(filters)
        .sort({ createdAt: -1 })
        .populate("seller", "name email");

      return res.json(listings);
    }

    // Nearby searches must have both coordinates
    if (!hasLongitude || !hasLatitude) {
      return res.status(400).json({
        message: "Both longitude and latitude are required",
      });
    }

    const longitudeNumber = Number(longitude);
    const latitudeNumber = Number(latitude);
    const radiusNumber = Number(radius);

    if (
      !Number.isFinite(longitudeNumber) ||
      longitudeNumber < -180 ||
      longitudeNumber > 180
    ) {
      return res.status(400).json({
        message: "Longitude must be between -180 and 180",
      });
    }

    if (
      !Number.isFinite(latitudeNumber) ||
      latitudeNumber < -90 ||
      latitudeNumber > 90
    ) {
      return res.status(400).json({
        message: "Latitude must be between -90 and 90",
      });
    }

    if (!Number.isFinite(radiusNumber) || radiusNumber <= 0) {
      return res.status(400).json({
        message: "Radius must be a positive number",
      });
    }

    // NEARBY LISTINGS
    const listings = await Listing.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitudeNumber, latitudeNumber],
          },
          key: "location",
          distanceField: "distanceInMeters",
          maxDistance: radiusNumber * 1000,
          spherical: true,
          query: filters,
        },
      },
      {
        $addFields: {
          distance: {
            $round: [
              { $divide: ["$distanceInMeters", 1000] },
              2,
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "seller",
          foreignField: "_id",
          as: "seller",
        },
      },
      {
        $unwind: {
          path: "$seller",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          distanceInMeters: 0,
          "seller.password": 0,
        },
      },
    ]);

    return res.json(listings);
  } catch (error) {
    console.error("Get listings error:", error);
    return res.status(500).json({
      message: "Failed to fetch listings",
    });
  }
});

// MY LISTINGS
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const listings = await Listing.find({
      seller: req.user,
    }).sort({ createdAt: -1 });

    return res.json(listings);
  } catch (error) {
    console.error("My listings error:", error);
    return res.status(500).json({
      message: "Failed to fetch your listings",
    });
  }
});

// GET SINGLE LISTING
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate(
      "seller",
      "name email"
    );

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    return res.json(listing);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch listing",
    });
  }
});

// DELETE LISTING IMAGE
router.delete(
  "/:id/images/:imageIndex",
  authMiddleware,
  async (req, res) => {
    try {
      const { id, imageIndex } = req.params;
      const index = Number(imageIndex);

      if (!Number.isInteger(index) || index < 0) {
        return res.status(400).json({
          message: "Invalid image index",
        });
      }

      const listing = await Listing.findById(id);

      if (!listing) {
        return res.status(404).json({
          message: "Listing not found",
        });
      }

      if (listing.seller.toString() !== req.user) {
        return res.status(403).json({
          message: "You are not allowed to remove images from this listing",
        });
      }

      if (index >= listing.images.length) {
        return res.status(404).json({
          message: "Image not found",
        });
      }

      if (
        !listing.imagePublicIds ||
        !listing.imagePublicIds[index]
      ) {
        return res.status(400).json({
          message:
            "This image cannot be removed because its Cloudinary public ID is missing",
        });
      }

      const publicId = listing.imagePublicIds[index];

      const cloudinaryResult = await cloudinary.uploader.destroy(
        publicId
      );

      console.log("Cloudinary delete result:", cloudinaryResult);

      listing.images.splice(index, 1);
      listing.imagePublicIds.splice(index, 1);

      await listing.save();

      return res.json({
        message: "Image deleted successfully",
        images: listing.images,
        imagePublicIds: listing.imagePublicIds,
      });
    } catch (error) {
      console.error("Image delete error:", error);
      return res.status(500).json({
        message: "Failed to delete image",
      });
    }
  }
);

// UPDATE LISTING
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    if (listing.seller.toString() !== req.user) {
      return res.status(403).json({
        message: "You are not allowed to update this listing",
      });
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.json({
      message: "Listing updated successfully",
      listing: updatedListing,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update listing",
    });
  }
});

// DELETE LISTING AND ITS CLOUDINARY IMAGES
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    if (listing.seller.toString() !== req.user) {
      return res.status(403).json({
        message: "You are not allowed to delete this listing",
      });
    }

    if (
      listing.imagePublicIds &&
      listing.imagePublicIds.length > 0
    ) {
      for (const publicId of listing.imagePublicIds) {
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log("Deleted from Cloudinary:", publicId);
        } catch (cloudinaryError) {
          console.error(
            "Cloudinary delete failed:",
            publicId,
            cloudinaryError
          );
        }
      }
    }

    await Listing.findByIdAndDelete(id);

    return res.json({
      message: "Listing and associated images deleted successfully",
    });
  } catch (error) {
    console.error("Delete listing error:", error);
    return res.status(500).json({
      message: "Failed to delete listing",
    });
  }
});

// UPLOAD LISTING IMAGES
router.post(
  "/:id/images",
  authMiddleware,
  upload.array("images", 6),
  async (req, res) => {
    try {
      const { id } = req.params;

      const listing = await Listing.findById(id);

      if (!listing) {
        return res.status(404).json({
          message: "Listing not found",
        });
      }

      if (listing.seller.toString() !== req.user) {
        return res.status(403).json({
          message: "You are not allowed to upload images to this listing",
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          message: "No images uploaded",
        });
      }

      const uploadedImages = [];
      const uploadedPublicIds = [];

      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "hyperlocal-commerce/listings",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          stream.end(file.buffer);
        });

        uploadedImages.push(result.secure_url);
        uploadedPublicIds.push(result.public_id);
      }

      listing.images.push(...uploadedImages);
      listing.imagePublicIds.push(...uploadedPublicIds);

      await listing.save();

      return res.json({
        message: "Images uploaded successfully",
        images: listing.images,
        imagePublicIds: listing.imagePublicIds,
      });
    } catch (error) {
      console.error("Image upload error:", error);
      return res.status(500).json({
        message: "Failed to upload images",
      });
    }
  }
);

export default router;
