const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');

// Public routes (no auth required)
router.post('/register', adminAuthController.registerAdmin);
router.post('/login', adminAuthController.loginAdmin);

// Protected routes (admin token required)
router.get('/verify', authenticateAdmin, adminAuthController.verifyAdminToken);

module.exports = router;
