const express = require("express");
const router = express.Router();
const certificateController = require("../controllers/certificateController");
const { authenticateToken } = require("../middleware/authMiddleware");

// This test route can be removed now if you wish
router.get("/test", (req, res) => {
    res.status(200).send("The certificate route file is working!");
});

// Route to GENERATE (or retrieve) a certificate.
router.post("/course/:courseId", authenticateToken, certificateController.generateCertificate);

// Route to VIEW a certificate's details. This will now work.
router.get("/course/:courseId", authenticateToken, certificateController.getCertificate);

module.exports = router;