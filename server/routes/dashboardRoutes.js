const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
// Fix is on this line 👇
const { authenticateToken } = require("../middleware/authMiddleware");

// Student or Instructor Dashboard
// This will now work correctly
router.get("/", authenticateToken, dashboardController.getDashboard);

module.exports = router;