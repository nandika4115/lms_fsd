const db = require("../config/db");

// A security helper function to ensure the user making a request is the course owner.
const verifyCourseOwner = (courseId, instructorId, callback) => {
    const query = "SELECT instructor_id FROM courses WHERE id = ?";
    db.query(query, [courseId], (err, results) => {
        if (err) return callback(err);
        if (results.length === 0) return callback(new Error("Course not found."));
        if (results[0].instructor_id !== instructorId) {
            return callback(new Error("User is not the owner of this course."));
        }
        callback(null); // Success
    });
};

// --- Add a new lesson to a course (as Instructor) ---
exports.addLesson = (req, res) => {
    const instructorId = req.user.id;
    const courseId = parseInt(req.params.courseId, 10);
    const { title, content_url } = req.body;

    verifyCourseOwner(courseId, instructorId, (err) => {
        if (err) return res.status(403).json({ message: "Permission denied: " + err.message });

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
    });
};

// --- Get all lessons for a specific course ---
exports.getLessonsByCourse = (req, res) => {
    const courseId = parseInt(req.params.courseId, 10);
    db.query("SELECT * FROM lessons WHERE course_id = ? ORDER BY lesson_order ASC", [courseId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// --- Update a lesson's details (as Instructor) ---
exports.updateLesson = (req, res) => {
    const instructorId = req.user.id;
    const lessonId = parseInt(req.params.lessonId, 10);
    const { title, content_url } = req.body;

    const lessonQuery = "SELECT course_id FROM lessons WHERE id = ?";
    db.query(lessonQuery, [lessonId], (err, lessons) => {
        if (err || lessons.length === 0) return res.status(404).json({ message: "Lesson not found." });
        
        verifyCourseOwner(lessons[0].course_id, instructorId, (err) => {
            if (err) return res.status(403).json({ message: "Permission denied: " + err.message });

            const updateQuery = "UPDATE lessons SET title = ?, content = ? WHERE id = ?";
            db.query(updateQuery, [title, content_url, lessonId], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Lesson updated successfully." });
            });
        });
    });
};

// --- Delete a lesson (as Instructor) ---
exports.deleteLesson = (req, res) => {
    const instructorId = req.user.id;
    const lessonId = parseInt(req.params.lessonId, 10);

    const lessonQuery = "SELECT course_id FROM lessons WHERE id = ?";
    db.query(lessonQuery, [lessonId], (err, lessons) => {
        if (err || lessons.length === 0) return res.status(404).json({ message: "Lesson not found." });

        verifyCourseOwner(lessons[0].course_id, instructorId, (err) => {
            if (err) return res.status(403).json({ message: "Permission denied: " + err.message });

            const deleteQuery = "DELETE FROM lessons WHERE id = ?";
            db.query(deleteQuery, [lessonId], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Lesson deleted successfully." });
            });
        });
    });
};

// --- Reorder lessons for a course (as Instructor) ---
exports.reorderLessons = (req, res) => {
    const instructorId = req.user.id;
    const courseId = parseInt(req.params.courseId, 10);
    const { orderedLessonIds } = req.body;

    verifyCourseOwner(courseId, instructorId, (err) => {
        if (err) return res.status(403).json({ message: "Permission denied: " + err.message });

        const queries = orderedLessonIds.map((lessonId, index) => {
            return db.format("UPDATE lessons SET lesson_order = ? WHERE id = ? AND course_id = ?;", [index + 1, lessonId, courseId]);
        });

        db.query(queries.join(' '), (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Lesson order updated successfully." });
        });
    });
};

// --- Get a single lesson by its own ID (with Security Check) ---
exports.getLessonById = (req, res) => {
    const lessonId = parseInt(req.params.lessonId, 10);
    const studentId = req.user?.id; 

    if (!studentId) {
        return res.status(401).json({ message: "You must be logged in to view a lesson." });
    }

    const findCourseQuery = "SELECT course_id FROM lessons WHERE id = ?";
    db.query(findCourseQuery, [lessonId], (err, lessons) => {
        if (err || lessons.length === 0) return res.status(404).json({ message: "Lesson not found." });
        
        const courseId = lessons[0].course_id;

        const verifyEnrollmentQuery = "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?";
        db.query(verifyEnrollmentQuery, [studentId, courseId], (err, enrollments) => {
            if (err) return res.status(500).json({ error: "Database error checking enrollment." });
            
            if (enrollments.length === 0) {
                return res.status(403).json({ message: "You must be enrolled in this course to view its lessons." });
            }

            db.query("SELECT * FROM lessons WHERE id = ?", [lessonId], (err, lessonDetails) => {
                if (err || lessonDetails.length === 0) return res.status(404).json({ message: "Lesson not found" });
                res.json(lessonDetails[0]);
            });
        });
    });
};

// --- Mark a lesson as complete (as Student) ---
exports.markLessonComplete = (req, res) => {
    const studentId = req.user.id;
    const lessonId = parseInt(req.params.lessonId, 10);

    const findCourseQuery = "SELECT course_id FROM lessons WHERE id = ?";
    db.query(findCourseQuery, [lessonId], (err, lessons) => {
        if (err) return res.status(500).json({ error: "Database error finding lesson." });
        if (lessons.length === 0) return res.status(404).json({ message: "Lesson not found." });
        
        const courseId = lessons[0].course_id;

        const verifyEnrollmentQuery = "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?";
        db.query(verifyEnrollmentQuery, [studentId, courseId], (err, enrollments) => {
            if (err) return res.status(500).json({ error: "Database error checking enrollment." });
            
            if (enrollments.length === 0) {
                return res.status(403).json({ message: "You must be enrolled in this course to complete lessons." });
            }

            const insertQuery = "INSERT IGNORE INTO lesson_completions (student_id, lesson_id, course_id) VALUES (?, ?, ?)";
            db.query(insertQuery, [studentId, lessonId, courseId], (err, result) => {
                if (err) return res.status(500).json({ error: "Database error marking complete." });
                res.status(201).json({ message: "Lesson marked as complete." });
            });
        });
    });
};

