// In routes/courseRoutes.js

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken, authenticateOptional } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES ---

// GET /api/courses - Get all published courses
// This now uses authenticateOptional. It will check for a token if it exists.
router.get('/', authenticateOptional, courseController.getCourses);

// GET /api/courses/filters - Get dynamic filter options
router.get('/filters', courseController.getCourseFilters);

// GET /api/courses/:id - Get a single course's details
// This also uses authenticateOptional to show resume data for logged-in users
router.get('/:id', authenticateOptional, courseController.getCourseById);


// --- INSTRUCTOR-ONLY ROUTES (Protected) ---

// POST /api/courses - Create a new course
router.post('/', authenticateToken, courseController.createCourse);

// PUT /api/courses/:id - Update course details
router.put('/:id', authenticateToken, courseController.updateCourse);

// PATCH /api/courses/:id/status - Update course status (publish/draft)
router.patch('/:id/status', authenticateToken, courseController.updateCourseStatus);

// DELETE /api/courses/:id - Delete a course
router.delete('/:id', authenticateToken, courseController.deleteCourse);

module.exports = router;