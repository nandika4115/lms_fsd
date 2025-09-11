const express = require("express");
const router = express.Router();
const lessonController = require("../controllers/lessonController");
const {authenticateToken} = require("../middleware/authMiddleware");

// Instructor: add lesson to a course
router.post("/:courseId/lessons", authenticateToken, lessonController.addLesson);

// Student: view a lesson
router.get("/:lessonId", authenticateToken, lessonController.getLessonById);

module.exports = router;
