import express from "express";
import Listing from "../models/Listing.js";
import authMiddleware from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";
import upload from "../middleware/upload.js";


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

router.get("/", async (req, res) => {
    try {
        const {
            longitude,
            latitude,
            radius = 3,
            category,
            minPrice,
            maxPrice
        } = req.query;

        // --------------------------------
        // Validate coordinates
        // --------------------------------

        if (
            longitude === undefined ||
            latitude === undefined
        ) {
            return res.status(400).json({
                message:
                    "Longitude and latitude are required"
            });
        }

        const longitudeNumber = Number(longitude);
        const latitudeNumber = Number(latitude);
        const radiusNumber = Number(radius);

        if (
            !Number.isFinite(longitudeNumber) ||
            !Number.isFinite(latitudeNumber)
        ) {
            return res.status(400).json({
                message:
                    "Invalid longitude or latitude"
            });
        }

        if (
            latitudeNumber < -90 ||
            latitudeNumber > 90
        ) {
            return res.status(400).json({
                message: "Latitude must be between -90 and 90"
            });
        }

        if (
            longitudeNumber < -180 ||
            longitudeNumber > 180
        ) {
            return res.status(400).json({
                message:
                    "Longitude must be between -180 and 180"
            });
        }

        if (
            !Number.isFinite(radiusNumber) ||
            radiusNumber <= 0
        ) {
            return res.status(400).json({
                message:
                    "Radius must be a positive number"
            });
        }

        // --------------------------------
        // Build optional filters
        // --------------------------------

        const filters = {};

        if (category) {
            filters.category = category;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filters.price = {};

            if (minPrice !== undefined) {
                const minPriceNumber = Number(minPrice);

                if (!Number.isFinite(minPriceNumber)) {
                    return res.status(400).json({
                        message:
                            "Invalid minimum price"
                    });
                }

                filters.price.$gte = minPriceNumber;
            }

            if (maxPrice !== undefined) {
                const maxPriceNumber = Number(maxPrice);

                if (!Number.isFinite(maxPriceNumber)) {
                    return res.status(400).json({
                        message:
                            "Invalid maximum price"
                    });
                }

                filters.price.$lte = maxPriceNumber;
            }
        }

        // --------------------------------
        // Geospatial search
        // --------------------------------

        const listings = await Listing.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [
                            longitudeNumber,
                            latitudeNumber
                        ]
                    },

                    key: "location",

                    distanceField: "distanceInMeters",

                    maxDistance:
                        radiusNumber * 1000,

                    spherical: true,

                    query: filters
                }
            },

            // --------------------------------
            // Convert meters to kilometers
            // --------------------------------

            {
                $addFields: {
                    distance: {
                        $round: [
                            {
                                $divide: [
                                    "$distanceInMeters",
                                    1000
                                ]
                            },
                            2
                        ]
                    }
                }
            },

            // --------------------------------
            // Populate seller
            // --------------------------------

            {
                $lookup: {
                    from: "users",

                    localField: "seller",

                    foreignField: "_id",

                    as: "seller"
                }
            },

            {
                $unwind: {
                    path: "$seller",
                    preserveNullAndEmptyArrays: true
                }
            },

            // --------------------------------
            // Remove internal distance field
            // --------------------------------

            {
                $project: {
                    distanceInMeters: 0,

                    "seller.password": 0
                }
            }
        ]);

        res.json(listings);

    } catch (error) {
        console.error(
            "Get listings error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to fetch listings"
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const listing = await Listing.findById(id)
            .populate("seller", "name email");

        if (!listing) {
            return res.status(404).json({
                message: "Listing not found"
            });
        }

        res.json(listing);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch listing"
        });
    }
});

router.delete(
    "/:id/images/:imageIndex",
    authMiddleware,
    async (req, res) => {
        try {
            const { id, imageIndex } = req.params;

            const index = Number(imageIndex);

            if (!Number.isInteger(index) || index < 0) {
                return res.status(400).json({
                    message: "Invalid image index"
                });
            }

            // Find listing
            const listing = await Listing.findById(id);

            if (!listing) {
                return res.status(404).json({
                    message: "Listing not found"
                });
            }

            // Check ownership
            if (listing.seller.toString() !== req.user) {
                return res.status(403).json({
                    message:
                        "You are not allowed to remove images from this listing"
                });
            }

            // Check image exists
            if (index >= listing.images.length) {
                return res.status(404).json({
                    message: "Image not found"
                });
            }

            // Old listings may not have public IDs
            if (
                !listing.imagePublicIds ||
                !listing.imagePublicIds[index]
            ) {
                return res.status(400).json({
                    message:
                        "This image cannot be removed because its Cloudinary public ID is missing"
                });
            }

            const publicId =
                listing.imagePublicIds[index];

            // Delete image from Cloudinary
            const cloudinaryResult =
                await cloudinary.uploader.destroy(
                    publicId
                );

            console.log(
                "Cloudinary delete result:",
                cloudinaryResult
            );

            // Remove URL and public ID at the same index
            listing.images.splice(index, 1);
            listing.imagePublicIds.splice(index, 1);

            await listing.save();

            res.json({
                message:
                    "Image deleted successfully",
                images: listing.images,
                imagePublicIds:
                    listing.imagePublicIds
            });

        } catch (error) {
            console.error(
                "Image delete error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to delete image"
            });
        }
    }
);

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({
                message: "Listing not found"
            });
        }

        if (listing.seller.toString() !== req.user) {
            return res.status(403).json({
                message: "You are not allowed to update this listing"
            });
        }

        const updatedListing = await Listing.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.json({
            message: "Listing updated successfully",
            listing: updatedListing
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update listing"
        });
    }
});

router.delete(
    "/:id",
    authMiddleware,
    async (req, res) => {
        try {
            const { id } = req.params;

            // Find listing
            const listing = await Listing.findById(id);

            if (!listing) {
                return res.status(404).json({
                    message: "Listing not found"
                });
            }

            // Check ownership
            if (listing.seller.toString() !== req.user) {
                return res.status(403).json({
                    message:
                        "You are not allowed to delete this listing"
                });
            }

            // --------------------------------
            // Delete images from Cloudinary
            // --------------------------------

            if (
                listing.imagePublicIds &&
                listing.imagePublicIds.length > 0
            ) {
                for (const publicId of listing.imagePublicIds) {
                    try {
                        await cloudinary.uploader.destroy(
                            publicId
                        );

                        console.log(
                            "Deleted from Cloudinary:",
                            publicId
                        );

                    } catch (cloudinaryError) {
                        console.error(
                            "Cloudinary delete failed:",
                            publicId,
                            cloudinaryError
                        );
                    }
                }
            }

            // --------------------------------
            // Delete listing from MongoDB
            // --------------------------------

            await Listing.findByIdAndDelete(id);

            res.json({
                message:
                    "Listing and associated images deleted successfully"
            });

        } catch (error) {
            console.error(
                "Delete listing error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to delete listing"
            });
        }
    }
);

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
                    message: "Listing not found"
                });
            }

            // Check ownership
            if (listing.seller.toString() !== req.user) {
                return res.status(403).json({
                    message:
                        "You are not allowed to upload images to this listing"
                });
            }

            // Check files
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    message: "No images uploaded"
                });
            }

            const uploadedImages = [];
            const uploadedPublicIds = [];

            // Upload every image to Cloudinary
            for (const file of req.files) {

                const result = await new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream(
                                {
                                    folder:
                                        "hyperlocal-commerce/listings"
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
                    }
                );

                // Save URL
                uploadedImages.push(
                    result.secure_url
                );

                // Save public ID
                uploadedPublicIds.push(
                    result.public_id
                );
            }

            // Add URLs to listing
            listing.images.push(
                ...uploadedImages
            );

            // Add matching public IDs
            listing.imagePublicIds.push(
                ...uploadedPublicIds
            );

            await listing.save();

            res.json({
                message:
                    "Images uploaded successfully",

                images: listing.images,

                imagePublicIds:
                    listing.imagePublicIds
            });

        } catch (error) {

            console.error(
                "Image upload error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to upload images"
            });
        }
    }
);
export default router;