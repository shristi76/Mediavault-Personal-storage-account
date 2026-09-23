const Media = require("../models/Media");
const ShareLink = require("../models/ShareLink");
const cloudinary = require("../config/cloudinary");

// Upload media
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "mediavault",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    const media = await Media.create({
      owner: req.user,
      originalName: req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      size: result.bytes,
    });

    res.status(201).json({
      message: "Media uploaded successfully",
      media,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to upload media",
    });
  }
};

// Get user's media with search, filter and pagination
const getMyMedia = async (req, res) => {
  try {
    const {
      search,
      type,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      owner: req.user,
    };

    // Search by filename
    if (search) {
      filter.originalName = {
        $regex: search,
        $options: "i",
      };
    }

    // Filter by media type
    if (type && ["image", "video"].includes(type)) {
      filter.resourceType = type;
    }

    const pageNumber = Math.max(Number(page), 1);

    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      50
    );

    const skip = (pageNumber - 1) * limitNumber;

    const [media, total] = await Promise.all([
      Media.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),

      Media.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
      count: media.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages,
      media,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch media",
    });
  }
};

// Delete media
const deleteMedia = async (req, res) => {
  try {
    // Find media belonging to logged-in user
    const media = await Media.findOne({
      _id: req.params.id,
      owner: req.user,
    });

    if (!media) {
      return res.status(404).json({
        message: "Media not found",
      });
    }

    // Delete file from Cloudinary
    await cloudinary.uploader.destroy(media.publicId, {
      resource_type: media.resourceType,
    });

    // Delete all share links associated with this media
    await ShareLink.deleteMany({
      media: media._id,
    });

    // Delete media document from MongoDB
    await Media.findByIdAndDelete(media._id);

    res.status(200).json({
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete media",
    });
  }
};

module.exports = {
  uploadMedia,
  getMyMedia,
  deleteMedia,
};