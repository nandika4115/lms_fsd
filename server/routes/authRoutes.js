// authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Public auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Email verification (public — user clicks link from email)
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// MFA verification during login (public — uses temp token)
router.post('/verify-mfa', authController.verifyMfa);

// Token verification (protected)
router.get('/verify', authenticateToken, authController.verifyToken);

// MFA setup/management (protected — user must be logged in)
router.post('/setup-mfa', authenticateToken, authController.setupMfa);
router.post('/confirm-mfa', authenticateToken, authController.confirmMfa);
router.post('/disable-mfa', authenticateToken, authController.disableMfa);

module.exports = router;