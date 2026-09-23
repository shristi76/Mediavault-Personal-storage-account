const express = require("express");
const {
  authLimiter,
} = require("../middleware/rateLimitMiddleware");
const {
  registerUser,
  loginUser,
} = require("../controller/authController");

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);

module.exports = router;