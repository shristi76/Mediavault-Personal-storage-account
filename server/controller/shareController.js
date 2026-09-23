const crypto = require("crypto");
const Media = require("../models/Media");
const ShareLink = require("../models/ShareLink");

const createShareLink = async (req, res) => {
  try {
    const { mediaId, expiresInHours = 24, maxDownloads = 5 } = req.body;

    if (!mediaId) {
      return res.status(400).json({
        message: "Media ID is required",
      });
    }

    const media = await Media.findOne({
      _id: mediaId,
      owner: req.user,
    });

    if (!media) {
      return res.status(404).json({
        message: "Media not found",
      });
    }

    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(
      Date.now() + Number(expiresInHours) * 60 * 60 * 1000
    );

    const shareLink = await ShareLink.create({
      media: media._id,
      owner: req.user,
      token,
      expiresAt,
      maxDownloads: Number(maxDownloads) || 5,
    });

    res.status(201).json({
      message: "Share link created successfully",
      shareLink: {
        id: shareLink._id,
        token: shareLink.token,
        expiresAt: shareLink.expiresAt,
        maxDownloads: shareLink.maxDownloads,
        url: `${process.env.CLIENT_URL || "http://localhost:5173"}/share/${shareLink.token}`,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create share link",
    });
  }
};

const getSharedMedia = async (req, res) => {
  try {
    const { token } = req.params;

    const shareLink = await ShareLink.findOne({ token }).populate("media");

    if (!shareLink) {
      return res.status(404).json({
        message: "Share link not found",
      });
    }

    if (new Date() > shareLink.expiresAt) {
      return res.status(410).json({
        message: "Share link has expired",
      });
    }

    if (shareLink.downloadCount >= shareLink.maxDownloads) {
      return res.status(403).json({
        message: "Download limit reached",
      });
    }

    res.status(200).json({
      media: {
        originalName: shareLink.media.originalName,
        url: shareLink.media.url,
        resourceType: shareLink.media.resourceType,
        format: shareLink.media.format,
        size: shareLink.media.size,
      },
      expiresAt: shareLink.expiresAt,
      downloadsRemaining: shareLink.maxDownloads - shareLink.downloadCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to access shared media",
    });
  }
};

const downloadSharedMedia = async (req, res) => {
  try {
    const { token } = req.params;

    const shareLink = await ShareLink.findOne({ token }).populate("media");

    if (!shareLink) {
      return res.status(404).json({
        message: "Share link not found",
      });
    }

    if (new Date() > shareLink.expiresAt) {
      return res.status(410).json({
        message: "Share link has expired",
      });
    }

    const updatedShareLink = await ShareLink.findOneAndUpdate(
      {
        _id: shareLink._id,
        downloadCount: { $lt: shareLink.maxDownloads },
      },
      {
        $inc: { downloadCount: 1 },
      },
      { new: true }
    );

    if (!updatedShareLink) {
      return res.status(403).json({
        message: "Download limit reached",
      });
    }

    res.status(200).json({
      url: shareLink.media.url,
      originalName: shareLink.media.originalName,
      downloadsRemaining:
        updatedShareLink.maxDownloads - updatedShareLink.downloadCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to download shared media",
    });
  }
};

const revokeShareLink = async (req, res) => {
  try {
    const { id } = req.params;

    const shareLink = await ShareLink.findOne({
      _id: id,
      owner: req.user,
    });

    if (!shareLink) {
      return res.status(404).json({
        message: "Share link not found",
      });
    }

    await ShareLink.findByIdAndDelete(shareLink._id);

    res.status(200).json({
      message: "Share link revoked successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to revoke share link",
    });
  }
};

const getMyShareLinks = async (req, res) => {
  try {
    const shareLinks = await ShareLink.find({ owner: req.user })
      .populate("media", "originalName url resourceType format size")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: shareLinks.length,
      shareLinks,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch share links",
    });
  }
};

module.exports = {
  createShareLink,
  getSharedMedia,
  downloadSharedMedia,
  revokeShareLink,
  getMyShareLinks,
};
