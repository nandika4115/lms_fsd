const db = require("../config/db");

// --- Create Course ---
// Handles thumbnail_url and defaults status to 'draft'
exports.createCourse = (req, res) => {
    const instructorId = req.user.id;
    const { title, description, category, level, thumbnail_url } = req.body;

    const query = "INSERT INTO courses (title, description, category, level, thumbnail_url, status, instructor_id) VALUES (?, ?, ?, ?, ?, 'draft', ?)";
    const values = [title, description, category, level, thumbnail_url, instructorId];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Course created successfully", courseId: result.insertId });
    });
};

// --- Edit Course ---
// Includes thumbnail_url and a crucial security check to ensure only the owner can edit.
exports.updateCourse = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const instructorId = req.user.id;

    // DEBUG LOGGING: Check the received IDs and their types
    console.log(`[updateCourse] Attempting to update course ID: ${courseId} (Type: ${typeof courseId}) by Instructor ID: ${instructorId} (Type: ${typeof instructorId})`);

    const { title, description, category, level, thumbnail_url } = req.body;

    const query = "UPDATE courses SET title = ?, description = ?, category = ?, level = ?, thumbnail_url = ? WHERE id = ? AND instructor_id = ?";
    const values = [title, description, category, level, thumbnail_url, courseId, instructorId];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // DEBUG LOGGING: Check the result of the database query
        console.log(`[updateCourse] Query result - Affected Rows: ${result.affectedRows}`);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Course not found or you are not the owner." });
        }
        res.json({ message: "Course updated successfully." });
    });
};

// --- Delete Course ---
// Includes a crucial security check to ensure only the owner can delete.
exports.deleteCourse = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const instructorId = req.user.id;

    // DEBUG LOGGING: Check the received IDs and their types
    console.log(`[deleteCourse] Attempting to delete course ID: ${courseId} (Type: ${typeof courseId}) by Instructor ID: ${instructorId} (Type: ${typeof instructorId})`);

    const query = "DELETE FROM courses WHERE id = ? AND instructor_id = ?";
    db.query(query, [courseId, instructorId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // DEBUG LOGGING: Check the result of the database query
        console.log(`[deleteCourse] Query result - Affected Rows: ${result.affectedRows}`);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Course not found or you are not the owner." });
        }
        res.json({ message: "Course deleted successfully." });
    });
};

// --- Update Status ---
exports.updateCourseStatus = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const instructorId = req.user.id;
    const { status } = req.body;

    // DEBUG LOGGING: Check the received IDs and their types
    console.log(`[updateCourseStatus] Attempting to update status for course ID: ${courseId} (Type: ${typeof courseId}) by Instructor ID: ${instructorId} (Type: ${typeof instructorId})`);

    if (status !== 'published' && status !== 'draft') {
        return res.status(400).json({ message: "Invalid status provided." });
    }

    const query = "UPDATE courses SET status = ? WHERE id = ? AND instructor_id = ?";
    db.query(query, [status, courseId, instructorId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // DEBUG LOGGING: Check the result of the database query
        console.log(`[updateCourseStatus] Query result - Affected Rows: ${result.affectedRows}`);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Course not found or you are not the owner." });
        }
        res.json({ message: `Course status updated to ${status}.` });
    });
};


// --- Get All Public Courses ---
// This now only shows 'published' courses to students.
exports.getCourses = (req, res) => {
    db.query("SELECT * FROM courses WHERE status = 'published'", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// --- Get Single Course with Lessons ---
exports.getCourseById = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid Course ID." });
    }
    const courseQuery = "SELECT * FROM courses WHERE id = ?";
    db.query(courseQuery, [courseId], (err, courseResults) => {
        if (err) return res.status(500).json({ error: "Database error fetching course." });
        if (courseResults.length === 0) return res.status(404).json({ message: "Course not found." });
        let courseData = courseResults[0];
        const lessonsQuery = "SELECT * FROM lessons WHERE course_id = ? ORDER BY created_at ASC";
        db.query(lessonsQuery, [courseId], (err, lessonResults) => {
            if (err) return res.status(500).json({ error: "Database error fetching lessons." });
            courseData.lessons = lessonResults;
            res.json(courseData);
        });
    });
};

