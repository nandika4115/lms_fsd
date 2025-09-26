const db = require('../config/db');

const discussionController = {
    createDiscussion: async (req, res) => {
        try {
            const { course_id, title, content } = req.body;
            const user_id = req.user.id; // Now use real auth
            
            const query = `
                INSERT INTO discussions (course_id, user_id, title, content) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *
            `;
            
            const result = await db.query(query, [course_id, user_id, title, content]);
            res.status(201).json({
                success: true,
                message: 'Discussion created successfully',
                discussion: result.rows[0]
            });
        } catch (error) {
            console.error('Error creating discussion:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create discussion',
                error: error.message
            });
        }
    },

    getCourseDiscussions: async (req, res) => {
        try {
            const { courseId } = req.params;
            
            const query = `
                SELECT d.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as author_name, 
                       u.email as author_email
                FROM discussions d
                LEFT JOIN users u ON d.user_id = u.id
                WHERE d.course_id = $1
                ORDER BY d.created_at DESC
            `;
            
            const result = await db.query(query, [courseId]);
            res.json({
                success: true,
                discussions: result.rows
            });
        } catch (error) {
            console.error('Error fetching discussions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch discussions',
                error: error.message
            });
        }
    },

    addReply: async (req, res) => {
        try {
            const { discussion_id, content } = req.body;
            const user_id = req.user.id; // Now use real auth
            
            const query = `
                INSERT INTO discussion_replies (discussion_id, user_id, content) 
                VALUES ($1, $2, $3) 
                RETURNING *
            `;
            
            const result = await db.query(query, [discussion_id, user_id, content]);
            res.status(201).json({
                success: true,
                message: 'Reply added successfully',
                reply: result.rows[0]
            });
        } catch (error) {
            console.error('Error adding reply:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add reply',
                error: error.message
            });
        }
    },

    getDiscussionReplies: async (req, res) => {
        try {
            const { discussionId } = req.params;
            
            const query = `
                SELECT dr.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as author_name, 
                       u.email as author_email
                FROM discussion_replies dr
                LEFT JOIN users u ON dr.user_id = u.id
                WHERE dr.discussion_id = $1
                ORDER BY dr.created_at ASC
            `;
            
            const result = await db.query(query, [discussionId]);
            res.json({
                success: true,
                replies: result.rows
            });
        } catch (error) {
            console.error('Error fetching replies:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch replies',
                error: error.message
            });
        }
    },

    getInstructorDiscussions: async (req, res) => {
        try {
            const instructor_id = req.user.id;
            
            const query = `
                SELECT d.*, 
                       c.title as course_title,
                       CONCAT(u.first_name, ' ', u.last_name) as student_name,
                       u.email as student_email,
                       (SELECT COUNT(*) FROM discussion_replies dr WHERE dr.discussion_id = d.id) as reply_count
                FROM discussions d
                JOIN courses c ON d.course_id = c.id
                LEFT JOIN users u ON d.user_id = u.id
                WHERE c.instructor_id = $1
                ORDER BY d.created_at DESC
            `;
            
            const result = await db.query(query, [instructor_id]);
            res.json({
                success: true,
                discussions: result.rows
            });
        } catch (error) {
            console.error('Error fetching instructor discussions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch discussions',
                error: error.message
            });
        }
    }
    
};

module.exports = discussionController;
