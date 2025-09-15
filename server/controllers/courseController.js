const db = require("../config/db");

// --- Get All Public Courses (with Search, Filtering, and Resume Logic) ---
exports.getCourses = (req, res) => {
    const studentId = req.user?.id; // Safely get the user ID if they are logged in
    const { search, category, level } = req.query;

    let selectClause = "SELECT c.*";
    const fromClause = "FROM courses c";
    let whereClauses = ["c.status = 'published'"];
    const queryParams = [];

    // If a student is logged in, add a subquery to find their resume lesson ID for each course
    if (studentId) {
        selectClause += `, (
            SELECT l.id
            FROM lessons l
            WHERE 
                l.course_id = c.id 
                AND 
                l.id NOT IN (SELECT lc.lesson_id FROM lesson_completions lc WHERE lc.student_id = ?)
            ORDER BY 
                COALESCE(l.lesson_order, l.id) ASC
            LIMIT 1
        ) as resumeLessonId`;
        queryParams.push(studentId);
    }

    // Add search and filter clauses to the query
    if (search) {
        whereClauses.push("c.title LIKE ?");
        queryParams.push(`%${search}%`);
    }
    if (category) {
        whereClauses.push("c.category = ?");
        queryParams.push(category);
    }
    if (level) {
        whereClauses.push("c.level = ?");
        queryParams.push(level);
    }

    // Assemble the final query
    const finalQuery = `${selectClause} ${fromClause} WHERE ${whereClauses.join(' AND ')}`;

    db.query(finalQuery, queryParams, (err, results) => {
        if (err) {
            console.error("GET COURSES SQL ERROR:", err);
            return res.status(500).json({ error: "Failed to load courses." });
        }
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

// --- Get a Single Course by ID (with Secure Lesson Content) ---
exports.getCourseById = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const studentId = req.user?.id;
    const userRole = req.user?.role;

    if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid Course ID." });
    }

    const courseQuery = `
        SELECT courses.*, users.username as instructor_name 
        FROM courses JOIN users ON courses.instructor_id = users.id 
        WHERE courses.id = ?
    `;

    db.query(courseQuery, [courseId], (err, courseResults) => {
        if (err) return res.status(500).json({ error: "Database error fetching course." });
        if (courseResults.length === 0) return res.status(404).json({ message: "Course not found." });
        
        let courseData = courseResults[0];
        const lessonsQuery = "SELECT id, course_id, title, lesson_order, content FROM lessons WHERE course_id = ? ORDER BY lesson_order ASC";

        db.query(lessonsQuery, [courseId], (err, allLessons) => {
            if (err) return res.status(500).json({ error: "Database error fetching lessons." });

            // If user is not an enrolled student, hide the sensitive lesson content (video URL)
            const checkEnrollment = (callback) => {
                if (userRole !== 'student' || !studentId) {
                    return callback(null, false); // Not a student or not logged in
                }
                const enrollmentQuery = "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?";
                db.query(enrollmentQuery, [studentId, courseId], (err, enrollments) => {
                    if (err) return callback(err);
                    callback(null, enrollments.length > 0); // Is enrolled
                });
            };

            checkEnrollment((err, isEnrolled) => {
                if (err) return res.status(500).json({ error: "Database error checking enrollment." });

                if (!isEnrolled) {
                    courseData.lessons = allLessons.map(lesson => ({ ...lesson, content: null }));
                    return res.json(courseData);
                }

                // If the user is enrolled, fetch their completion data
                const completionQuery = "SELECT lesson_id FROM lesson_completions WHERE student_id = ? AND course_id = ?";
                db.query(completionQuery, [studentId, courseId], (err, completedLessons) => {
                    if (err) return res.status(500).json({ error: "Database error fetching completions." });

                    const completedLessonIds = new Set(completedLessons.map(l => l.lesson_id));
                    const lessonsWithStatus = allLessons.map(lesson => ({
                        ...lesson,
                        is_completed: completedLessonIds.has(lesson.id)
                    }));

                    const firstUncompletedLesson = lessonsWithStatus.find(l => !l.is_completed);
                    courseData.resumeLessonId = firstUncompletedLesson ? firstUncompletedLesson.id : (allLessons[0]?.id || null);
                    courseData.lessons = lessonsWithStatus;
                    res.json(courseData);
                });
            });
        });
    });
};

// --- All Instructor Course Management Functions ---
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

