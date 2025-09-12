const express = require("express");
const router = express.Router();
const lessonController = require("../controllers/lessonController");
const { authenticateToken } = require("../middleware/authMiddleware");

// --- GET all lessons for a specific course (ordered) ---
// Used by the "Manage Course" page to list lessons.
router.get("/course/:courseId", authenticateToken, lessonController.getLessonsByCourse);

// --- CREATE a new lesson for a specific course ---
// Used by the "Manage Course" page to add a new lesson.
router.post("/course/:courseId", authenticateToken, lessonController.addLesson);

// --- UPDATE the order of all lessons for a course ---
// Used by the "Manage Course" page after drag-and-drop reordering.
router.put("/course/:courseId/order", authenticateToken, lessonController.updateLessonOrder);

// --- GET a single lesson by its own ID (for student viewing) ---
router.get("/:lessonId", authenticateToken, lessonController.getLessonById);

// --- UPDATE a single lesson's details ---
// Used by the "Manage Course" page when editing a lesson.
router.put("/:lessonId", authenticateToken, lessonController.updateLesson);

// --- DELETE a single lesson ---
// Used by the "Manage Course" page to delete a lesson.
router.delete("/:lessonId", authenticateToken, lessonController.deleteLesson);

module.exports = router;

