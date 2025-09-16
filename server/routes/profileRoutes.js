const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { authenticateToken } = require("../middleware/authMiddleware"); // ✅ destructured

// Get profile
router.get("/", authenticateToken, profileController.getProfile);

// Update profile
router.put("/", authenticateToken, profileController.updateProfile);

// Update profile picture
router.post("/picture", authenticateToken, profileController.uploadProfilePicture);

module.exports = router;
