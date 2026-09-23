const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const shareRoutes = require("./routes/shareRoutes");
const { apiLimiter } = require("./middleware/rateLimitMiddleware");
const protect = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api", apiLimiter);

connectDB();

app.use("/api/media", mediaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/share", shareRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "MediaVault API is running 🚀",
  });
});

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "You accessed a protected route 🔐",
    userId: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});