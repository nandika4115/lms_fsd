const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
// Import both middleware functions from your updated file
const { authenticateToken, authenticateOptional } = require("../middleware/authMiddleware");

// --- Public routes for the main courses page ---
router.get("/", courseController.getCourses);
router.get("/filters", courseController.getCourseFilters);

// --- THIS IS THE CRITICAL FIX ---
// This route for a single course now uses the 'authenticateOptional' middleware.
// It will now correctly identify logged-in users, which will solve the
// "You must be enrolled" error, while still allowing guests to view the page.
router.get("/:id", authenticateOptional, courseController.getCourseById);


// --- Instructor-only routes that require a strict login ---
router.post("/", authenticateToken, courseController.createCourse);
router.put("/:id", authenticateToken, courseController.updateCourse);
router.delete("/:id", authenticateToken, courseController.deleteCourse);
router.patch("/:id/status", authenticateToken, courseController.updateCourseStatus);


module.exports = router;

