const db = require("../config/db");

// --- Get All Public Courses (with Search and Filtering) ---
exports.getCourses = (req, res) => {
    const { search, category, level } = req.query;

    let query = "SELECT * FROM courses WHERE status = 'published'";
    const queryParams = [];

    if (search) {
        query += " AND title LIKE ?";
        queryParams.push(`%${search}%`);
    }
    if (category) {
        query += " AND category = ?";
        queryParams.push(category);
    }
    if (level) {
        query += " AND level = ?";
        queryParams.push(level);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// --- Get Dynamic Filter Options ---
exports.getCourseFilters = (req, res) => {
    const categoriesQuery = "SELECT DISTINCT category FROM courses WHERE status = 'published' AND category IS NOT NULL AND category != '' ORDER BY category ASC";
    const levelsQuery = "SELECT DISTINCT level FROM courses WHERE status = 'published' AND level IS NOT NULL AND level != '' ORDER BY level ASC";

    let filters = {};

    db.query(categoriesQuery, (err, categories) => {
        if (err) return res.status(500).json({ error: err.message });
        filters.categories = categories.map(c => c.category);

        db.query(levelsQuery, (err, levels) => {
            if (err) return res.status(500).json({ error: err.message });
            filters.levels = levels.map(l => l.level);
            res.json(filters);
        });
    });
};

// --- Get a Single Course by ID (with Lessons and Instructor Name) ---
exports.getCourseById = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid Course ID." });
    }

    const courseQuery = `
        SELECT courses.*, users.username as instructor_name 
        FROM courses 
        JOIN users ON courses.instructor_id = users.id 
        WHERE courses.id = ?
    `;

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

// --- Create a New Course (as Instructor) ---
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

// --- Update a Course (as Instructor) ---
exports.updateCourse = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const { title, description, category, level, thumbnail_url } = req.body;

    const query = "UPDATE courses SET title = ?, description = ?, category = ?, level = ?, thumbnail_url = ? WHERE id = ? AND instructor_id = ?";
    const values = [title, description, category, level, thumbnail_url, courseId, req.user.id];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Course not found or you are not the owner." });
        }
        res.json({ message: "Course updated successfully." });
    });
};

// --- Delete a Course (as Instructor) ---
exports.deleteCourse = (req, res) => {
    const courseId = parseInt(req.params.id, 10);

    const query = "DELETE FROM courses WHERE id = ? AND instructor_id = ?";
    db.query(query, [courseId, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Course not found or you are not the owner." });
        }
        res.json({ message: "Course deleted successfully." });
    });
};

// --- Update Course Status (as Instructor) ---
exports.updateCourseStatus = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (status !== 'published' && status !== 'draft') {
        return res.status(400).json({ message: "Invalid status provided." });
    }

    const query = "UPDATE courses SET status = ? WHERE id = ? AND instructor_id = ?";
    db.query(query, [status, courseId, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Course not found or you are not the owner." });
        }
        res.json({ message: `Course status updated to ${status}.` });
    });
};

