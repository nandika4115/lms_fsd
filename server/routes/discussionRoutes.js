const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');

// Copy the EXACT import line from your courseRoutes.js or lessonRoutes.js
const { authenticateToken } = require("../middleware/authMiddleware");

// Test route (no auth needed)
router.get('/test', (req, res) => {
    res.json({ message: 'Discussion routes working!' });
});

// Discussion routes WITH auth
router.post('/create', authenticateToken, discussionController.createDiscussion);
router.get('/course/:courseId', authenticateToken, discussionController.getCourseDiscussions);
router.post('/reply', authenticateToken, discussionController.addReply);
router.get('/:discussionId/replies', authenticateToken, discussionController.getDiscussionReplies);
router.get('/instructor/my-discussions', authenticateToken, discussionController.getInstructorDiscussions);

module.exports = router;
