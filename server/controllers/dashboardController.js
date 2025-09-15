const db = require("../config/db");

exports.getDashboard = (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'student') {
        // --- THIS IS THE DEFINITIVE, UPGRADED QUERY FOR STUDENTS ---
        // This query is more robust and correctly finds the first uncompleted lesson,
        // even if the lesson_order data is inconsistent.
        const query = `
            SELECT 
                c.id as course_id,
                c.title as course_title,
                c.thumbnail_url,
                (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
                (SELECT COUNT(*) FROM lesson_completions lc WHERE lc.student_id = e.student_id AND lc.course_id = c.id) as completed_lessons,
                (
                    SELECT l.id
                    FROM lessons l
                    WHERE 
                        l.course_id = c.id 
                        AND 
                        l.id NOT IN (SELECT lc.lesson_id FROM lesson_completions lc WHERE lc.student_id = e.student_id AND lc.course_id = c.id)
                    ORDER BY 
                        COALESCE(l.lesson_order, l.id) ASC -- Prioritize lesson_order, but fall back to the lesson ID
                    LIMIT 1
                ) as resumeLessonId
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = ?;
        `;
        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error("STUDENT DASHBOARD SQL ERROR:", err);
                return res.status(500).json({ error: "Failed to load dashboard data." });
            }
            res.json(results);
        });

    } else if (userRole === 'instructor') {
        // Instructor logic remains the same.
        const query = `
            SELECT 
                c.id as course_id,
                c.title as course_title,
                c.status,
                c.thumbnail_url,
                (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count,
                (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count
            FROM courses c
            WHERE c.instructor_id = ?;
        `;
        db.query(query, [userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });

    } else {
        res.status(403).json({ message: "Unknown user role." });
    }
};

