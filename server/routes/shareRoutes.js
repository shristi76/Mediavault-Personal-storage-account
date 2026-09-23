const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  createShareLink,
  getSharedMedia,
  downloadSharedMedia,
  revokeShareLink,
  getMyShareLinks,
} = require("../controller/shareController");
const router = express.Router();
const {
  downloadLimiter,
} = require("../middleware/rateLimitMiddleware");

router.post("/", protect, createShareLink);
router.get("/", protect, getMyShareLinks);
router.get("/:token", getSharedMedia);
router.delete("/:id", protect, revokeShareLink);
router.post(
  "/:token/download",
  downloadLimiter,
  downloadSharedMedia
);

module.exports = router;