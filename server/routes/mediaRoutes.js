const express = require("express");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  uploadMedia,
  getMyMedia,
  deleteMedia,
} = require("../controller/mediaController");
const router = express.Router();

router.post(
  "/upload",
  protect,
  upload.single("file"),
  uploadMedia
);

router.get("/", protect, getMyMedia);
router.delete("/:id", protect, deleteMedia);

module.exports = router;