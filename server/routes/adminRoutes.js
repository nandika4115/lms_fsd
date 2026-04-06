const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');

// All admin routes require admin token from MongoDB
router.get('/admins', authenticateAdmin, adminController.getAdmins);
router.get('/announcements', authenticateAdmin, adminController.getAnnouncements);
router.post('/announcements', authenticateAdmin, adminController.createAnnouncement);

// Proxy to Postgres users (students/instructors)
router.get('/users', authenticateAdmin, adminController.getUsers);

// Admin stats and approval flows
router.get('/stats', authenticateAdmin, adminController.getStats);
router.post('/users/:id/approve', authenticateAdmin, adminController.approveUser);
router.post('/users/:id/reject', authenticateAdmin, adminController.rejectUser);
router.delete('/users/:id', authenticateAdmin, adminController.deleteUser);

module.exports = router;
