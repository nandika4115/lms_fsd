const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Enroll in a course - Use 'enrollInCourse'
router.post("/:courseId", authenticateToken, enrollmentController.enrollInCourse);

// Get student's enrolled courses - Use 'getEnrolledCourses'
router.get("/", authenticateToken, enrollmentController.getEnrolledCourses);

// You can add a route for checking status too
router.get("/:courseId/status", authenticateToken, enrollmentController.getEnrollmentStatus);

module.exports = router;