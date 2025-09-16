const express = require("express");
const router = express.Router();
// This line makes sure it's loading the CONTROLLER, not another route file.
const certificateController = require("../controllers/certificateController"); 
const { authenticateToken } = require("../middleware/authMiddleware");

// Route to GENERATE (or retrieve) a certificate. Creates a record in the DB.
router.post("/course/:courseId", authenticateToken, certificateController.generateCertificate);

// Route to VIEW a certificate's details.
router.get("/course/:courseId", authenticateToken, certificateController.getCertificate);

module.exports = router;

