const express = require("express");
const router = express.Router();
const lessonController = require("../controllers/lessonController");
const { authenticateToken } = require("../middleware/authMiddleware");

// --- Routes for Instructors to manage all lessons within a course ---
router.get("/course/:courseId", authenticateToken, lessonController.getLessonsByCourse);
router.post("/course/:courseId", authenticateToken, lessonController.addLesson);
router.put("/course/:courseId/order", authenticateToken, lessonController.reorderLessons);

// --- Routes for a single lesson (viewing, editing, deleting) ---
router.get("/:lessonId", authenticateToken, lessonController.getLessonById);
router.put("/:lessonId", authenticateToken, lessonController.updateLesson);
router.delete("/:lessonId", authenticateToken, lessonController.deleteLesson);

// --- Route for Students to mark a lesson as complete ---
router.post("/:lessonId/complete", authenticateToken, lessonController.markLessonComplete);

module.exports = router;

