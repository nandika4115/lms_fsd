const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { authenticateToken } = require("../middleware/authMiddleware");

// --- Public Routes ---
// GET all published courses
router.get("/", courseController.getCourses);

// GET course filters (categories & levels)
router.get("/filters", courseController.getCourseFilters);  // 👈 ADD THIS

// GET a single course by ID
router.get("/:id", courseController.getCourseById);

// --- Instructor-Only Routes (Protected) ---
// POST a new course
router.post("/", authenticateToken, courseController.createCourse);

// PUT (update) a course's details
router.put("/:id", authenticateToken, courseController.updateCourse);

// DELETE a course
router.delete("/:id", authenticateToken, courseController.deleteCourse);

// PATCH (partially update) a course's status
router.patch("/:id/status", authenticateToken, courseController.updateCourseStatus);

module.exports = router;
