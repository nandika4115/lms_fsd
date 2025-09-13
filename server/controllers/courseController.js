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

// --- DEFINITIVE FIX V2: Get a Single Course with Enhanced Debugging ---
// --- FIXED VERSION: Get a Single Course with Proper Authentication ---
exports.getCourseById = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const studentId = req.user?.id;
    const userRole = req.user?.role;

    console.log(`[getCourseById] Fetching course ID: ${courseId}`);
    console.log(`[getCourseById] User ID: ${studentId}, Role: ${userRole}`);
    console.log(`[getCourseById] Full req.user object:`, req.user);

    if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid Course ID." });
    }

    // First, get the course details
    const courseQuery = `
        SELECT courses.*, users.username as instructor_name 
        FROM courses JOIN users ON courses.instructor_id = users.id 
        WHERE courses.id = ?
    `;

    db.query(courseQuery, [courseId], (err, courseResults) => {
        if (err) {
            console.error('[getCourseById] Database error fetching course:', err);
            return res.status(500).json({ error: "Database error fetching course." });
        }
        if (courseResults.length === 0) {
            return res.status(404).json({ message: "Course not found." });
        }
        
        let courseData = courseResults[0];

        // Get all lessons for this course
        const lessonsQuery = "SELECT id, course_id, title, lesson_order, content FROM lessons WHERE course_id = ? ORDER BY lesson_order ASC";
        db.query(lessonsQuery, [courseId], (err, allLessons) => {
            if (err) {
                console.error('[getCourseById] Database error fetching lessons:', err);
                return res.status(500).json({ error: "Database error fetching lessons." });
            }

            // If user is not authenticated or not a student, hide lesson content
            if (!studentId || userRole !== 'student') {
                console.log(`[getCourseById] User not authenticated or not a student. Hiding lesson content.`);
                courseData.lessons = allLessons.map(lesson => ({ ...lesson, content: null }));
                return res.json(courseData);
            }

            // Check if the student is enrolled in this course
            const enrollmentQuery = "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?";
            db.query(enrollmentQuery, [studentId, courseId], (err, enrollments) => {
                if (err) {
                    console.error('[getCourseById] Database error checking enrollment:', err);
                    return res.status(500).json({ error: "Database error checking enrollment." });
                }

                console.log(`[getCourseById] Enrollment check: Student ${studentId}, Course ${courseId}, Found ${enrollments.length} enrollments`);

                // If not enrolled, hide lesson content but still return the course info
                if (enrollments.length === 0) {
                    console.log(`[getCourseById] Student not enrolled. Hiding lesson content.`);
                    courseData.lessons = allLessons.map(lesson => ({ ...lesson, content: null }));
                    return res.json(courseData);
                }

                // Student is enrolled, get completion status
                console.log(`[getCourseById] Student is enrolled. Fetching completion status.`);
                const completionQuery = "SELECT lesson_id FROM lesson_completions WHERE student_id = ? AND course_id = ?";
                db.query(completionQuery, [studentId, courseId], (err, completedLessons) => {
                    if (err) {
                        console.error('[getCourseById] Database error fetching completions:', err);
                        return res.status(500).json({ error: "Database error fetching completions." });
                    }

                    const completedLessonIds = new Set(completedLessons.map(l => l.lesson_id));
                    const lessonsWithStatus = allLessons.map(lesson => ({
                        ...lesson,
                        is_completed: completedLessonIds.has(lesson.id)
                    }));

                    courseData.lessons = lessonsWithStatus;
                    console.log(`[getCourseById] Returning course data with ${lessonsWithStatus.length} lessons`);
                    res.json(courseData);
                });
            });
        });
    });
};

// --- All Instructor Course Management Functions ---
// (These are assumed to be correct from previous steps)
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

exports.updateCourse = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const { title, description, category, level, thumbnail_url } = req.body;
    const query = "UPDATE courses SET title = ?, description = ?, category = ?, level = ?, thumbnail_url = ? WHERE id = ? AND instructor_id = ?";
    const values = [title, description, category, level, thumbnail_url, courseId, req.user.id];
    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Course not found or you are not the owner." });
        res.json({ message: "Course updated successfully." });
    });
};

exports.deleteCourse = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const query = "DELETE FROM courses WHERE id = ? AND instructor_id = ?";
    db.query(query, [courseId, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Course not found or you are not the owner." });
        res.json({ message: "Course deleted successfully." });
    });
};

exports.updateCourseStatus = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (status !== 'published' && status !== 'draft') {
        return res.status(400).json({ message: "Invalid status provided." });
    }
    const query = "UPDATE courses SET status = ? WHERE id = ? AND instructor_id = ?";
    db.query(query, [status, courseId, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Course not found or you are not the owner." });
        res.json({ message: `Course status updated to ${status}.` });
    });
};

