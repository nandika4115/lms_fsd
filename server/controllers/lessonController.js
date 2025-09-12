const db = require("../config/db");

// --- Security Middleware: Verify the user owns the course ---
const verifyCourseOwner = (req, res, next) => {
    // This function assumes the course ID is in req.params.courseId
    const courseId = parseInt(req.params.courseId, 10);
    const instructorId = req.user.id;

    if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid Course ID." });
    }

    const query = "SELECT instructor_id FROM courses WHERE id = ?";
    db.query(query, [courseId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0 || results[0].instructor_id !== instructorId) {
            return res.status(403).json({ message: "Forbidden: You are not the owner of this course." });
        }
        next(); // If owner is verified, proceed to the next function
    });
};


// --- Get all lessons for a specific course ---
// UPDATED: Now fetches lessons using the new 'lesson_order' column
exports.getLessonsByCourse = (req, res) => {
    const courseId = parseInt(req.params.courseId, 10);
    const query = "SELECT * FROM lessons WHERE course_id = ? ORDER BY lesson_order ASC";
    db.query(query, [courseId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};


// --- Add a new lesson to a specific course ---
// UPDATED: Now calculates the correct order for the new lesson
exports.addLesson = [verifyCourseOwner, (req, res) => {
    const courseId = parseInt(req.params.courseId, 10);
    const { title, content_url } = req.body;

    // First, find the highest current lesson_order for this course
    const orderQuery = "SELECT MAX(lesson_order) as max_order FROM lessons WHERE course_id = ?";
    db.query(orderQuery, [courseId], (err, orderResult) => {
        if (err) return res.status(500).json({ error: err.message });

        const newOrder = (orderResult[0].max_order || 0) + 1;

        const insertQuery = "INSERT INTO lessons (course_id, title, content, lesson_order) VALUES (?, ?, ?, ?)";
        const values = [courseId, title, content_url, newOrder];

        db.query(insertQuery, values, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Lesson added successfully", lessonId: result.insertId });
        });
    });
}];


// --- NEW: Update the order of all lessons for a course ---
exports.updateLessonOrder = [verifyCourseOwner, (req, res) => {
    const { orderedLessonIds } = req.body; // Expects an array of lesson IDs in the new order

    if (!Array.isArray(orderedLessonIds) || orderedLessonIds.length === 0) {
        return res.status(400).json({ message: "Invalid lesson order data." });
    }

    // This creates a series of SQL queries to run one after another
    const queries = orderedLessonIds.map((lessonId, index) => {
        const newOrder = index + 1;
        return db.promise().query("UPDATE lessons SET lesson_order = ? WHERE id = ?", [newOrder, lessonId]);
    });

    Promise.all(queries)
        .then(() => {
            res.json({ message: "Lesson order updated successfully." });
        })
        .catch(err => {
            res.status(500).json({ error: err.message });
        });
}];


// --- Update a single lesson's details ---
// Note: This does not use verifyCourseOwner because it needs lessonId, not courseId
// Security is handled inside the function
exports.updateLesson = (req, res) => {
    const lessonId = parseInt(req.params.lessonId, 10);
    const instructorId = req.user.id;
    const { title, content_url } = req.body;

    // Securely find the course owner via the lessonId
    const query = `
        UPDATE lessons l
        JOIN courses c ON l.course_id = c.id
        SET l.title = ?, l.content = ?
        WHERE l.id = ? AND c.instructor_id = ?
    `;
    db.query(query, [title, content_url, lessonId, instructorId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Lesson not found or you are not the owner." });
        }
        res.json({ message: "Lesson updated successfully." });
    });
};


// --- Delete a single lesson ---
// Security is also handled inside this function
exports.deleteLesson = (req, res) => {
    const lessonId = parseInt(req.params.lessonId, 10);
    const instructorId = req.user.id;

    const query = `
        DELETE l FROM lessons l
        JOIN courses c ON l.course_id = c.id
        WHERE l.id = ? AND c.instructor_id = ?
    `;
    db.query(query, [lessonId, instructorId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Lesson not found or you are not the owner." });
        }
        res.json({ message: "Lesson deleted successfully." });
    });
};


// --- Get a single lesson by its ID (for student view) ---
exports.getLessonById = (req, res) => {
    const lessonId = parseInt(req.params.lessonId, 10);
    db.query("SELECT * FROM lessons WHERE id = ?", [lessonId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(404).json({ message: "Lesson not found" });
        }
        res.json(results[0]);
    });
};

