const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    resourceType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    format: {
      type: String,
    },

    size: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

mediaSchema.index({ owner: 1, createdAt: -1 });

mediaSchema.index({
  owner: 1,
  resourceType: 1,
  createdAt: -1,
});

const Media = mongoose.model("Media", mediaSchema);

module.exports = Media;