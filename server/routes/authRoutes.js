// authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Existing routes...
router.post('/login', authController.login);
router.post('/register', authController.register);

// ADD THIS LINE:
router.get('/verify', authenticateToken, authController.verifyToken);

module.exports = router;