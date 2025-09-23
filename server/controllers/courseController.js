const db = require("../config/db");
// --- Get All Public Courses (SIMPLE VERSION) ---
// --- Get All Public Courses (WITH ENHANCED DEBUGGING) ---
exports.getCourses = (req, res) => {
    const studentId = req.user?.id;
    const { search, category, level } = req.query;

    let selectClause = "SELECT c.*";
    const fromClause = "FROM courses c";
    let whereClauses = ["c.status = 'published'"];
    const queryParams = [];

    if (studentId) {
        selectClause += `, (
            SELECT l.id
            FROM lessons l
            WHERE 
                l.course_id = c.id 
                AND 
                l.id NOT IN (SELECT lc.lesson_id FROM lesson_completions lc WHERE lc.student_id = $1)
            ORDER BY 
                COALESCE(l.lesson_order, l.id) ASC
            LIMIT 1
        ) as resumeLessonId`;
        queryParams.push(studentId);
    }

    if (search) {
        whereClauses.push("c.title ILIKE $" + (queryParams.length + 1));
        queryParams.push(`%${search}%`);
    }
    if (category) {
        whereClauses.push("c.category = $" + (queryParams.length + 1));
        queryParams.push(category);
    }
    if (level) {
        whereClauses.push("c.level = $" + (queryParams.length + 1));
        queryParams.push(level);
    }

    const finalQuery = `${selectClause} ${fromClause} WHERE ${whereClauses.join(' AND ')}`;

    console.log("DEBUG: Executing getCourses query:", finalQuery);
    console.log("DEBUG: Query parameters:", queryParams);

    db.query(finalQuery, queryParams, (err, results) => {
        if (err) {
            console.error("FATAL: GET COURSES SQL ERROR:", err.stack);
            return res.status(500).json({ error: "Failed to load courses due to a server error." });
        }
        res.json(results.rows);
    });
};

// --- Get Dynamic Filter Options (WITH ENHANCED DEBUGGING) ---
// --- Get Dynamic Filter Options (WITH ENUM FIX) ---
exports.getCourseFilters = (req, res) => {
    const categoriesQuery = "SELECT DISTINCT category FROM courses WHERE status = 'published' AND category IS NOT NULL AND category != '' ORDER BY category ASC";
    
    // FIX is in the line below: level::text != ''
    const levelsQuery = "SELECT DISTINCT level FROM courses WHERE status = 'published' AND level IS NOT NULL AND level::text != '' ORDER BY level ASC";

    let filters = {};
    db.query(categoriesQuery, (err, categories) => {
        if (err) {
            console.error("FATAL: Get Categories Filter SQL ERROR:", err.stack);
            return res.status(500).json({ error: "Failed to load course categories." });
        }
        filters.categories = categories.rows.map(c => c.category);

        db.query(levelsQuery, (err, levels) => {
            if (err) {
                console.error("FATAL: Get Levels Filter SQL ERROR:", err.stack);
                return res.status(500).json({ error: "Failed to load course levels." });
            }
            filters.levels = levels.rows.map(l => l.level);
            res.json(filters);
        });
    });
};// ... keep all your other existing functions unchanged

// --- UPDATED: Get a Single Course by ID (with Secure Lesson Content and correct Resume Logic) ---
exports.getCourseById = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const studentId = req.user?.id;
    const userRole = req.user?.role;

    if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid Course ID." });
    }

    // PostgreSQL: Update parameter placeholder
    const courseQuery = `
        SELECT courses.*, users.username as instructor_name 
        FROM courses JOIN users ON courses.instructor_id = users.id 
        WHERE courses.id = $1
    `;

    db.query(courseQuery, [courseId], (err, courseResults) => {
        if (err) return res.status(500).json({ error: "Database error fetching course." });
        // PostgreSQL: Check .rows array
        if (courseResults.rows.length === 0) return res.status(404).json({ message: "Course not found." });
        
        // FIX: Get single course object, not array
        let courseData = courseResults.rows[0];
        const lessonsQuery = "SELECT id, course_id, title, lesson_order, content FROM lessons WHERE course_id = $1 ORDER BY lesson_order ASC";

        db.query(lessonsQuery, [courseId], (err, allLessons) => {
            if (err) return res.status(500).json({ error: "Database error fetching lessons." });

            // If user is not an enrolled student, hide the sensitive lesson content (video URL)
            const checkEnrollment = (callback) => {
                if (userRole !== 'student' || !studentId) {
                    return callback(null, false); // Not a student or not logged in
                }
                const enrollmentQuery = "SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2";
                db.query(enrollmentQuery, [studentId, courseId], (err, enrollments) => {
                    if (err) return callback(err);
                    // PostgreSQL: Check .rows array length
                    callback(null, enrollments.rows.length > 0); // Is enrolled
                });
            };

            checkEnrollment((err, isEnrolled) => {
                if (err) return res.status(500).json({ error: "Database error checking enrollment." });

                if (!isEnrolled) {
                    // PostgreSQL: Access via .rows array
                    courseData.lessons = allLessons.rows.map(lesson => ({ ...lesson, content: null }));
                    return res.json(courseData);
                }

                // If the user is enrolled, fetch their completion data
                const completionQuery = "SELECT lesson_id FROM lesson_completions WHERE student_id = $1 AND course_id = $2";
                db.query(completionQuery, [studentId, courseId], (err, completedLessons) => {
                    if (err) return res.status(500).json({ error: "Database error fetching completions." });

                    // PostgreSQL: Access via .rows array
                    const completedLessonIds = new Set(completedLessons.rows.map(l => l.lesson_id));
                    const lessonsWithStatus = allLessons.rows.map(lesson => ({
                        ...lesson,
                        is_completed: completedLessonIds.has(lesson.id)
                    }));

                    // Find the first lesson that is not completed.
                    const firstUncompletedLesson = lessonsWithStatus.find(l => !l.is_completed);
                    // If one is found, set its ID. If not (course is complete), set it to null.
                    courseData.resumeLessonId = firstUncompletedLesson ? firstUncompletedLesson.id : null;
                    
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
    
    console.log("🔄 Creating course for instructor:", instructorId);
    
    // PostgreSQL: Add RETURNING clause and update parameter placeholders
    const query = "INSERT INTO courses (title, description, category, level, thumbnail_url, status, instructor_id) VALUES ($1, $2, $3, $4, $5, 'draft', $6) RETURNING id";
    const values = [title, description, category, level, thumbnail_url, instructorId];
    
    db.query(query, values, (err, result) => {
        if (err) {
            console.error("❌ Course creation error:", err);
            return res.status(500).json({ error: err.message });
        }
        
        // FIX: PostgreSQL - Access inserted ID via result.rows[0].id
        const courseId = result.rows[0].id;
        console.log("✅ Course created with ID:", courseId);
        
        res.status(201).json({ 
            message: "Course created successfully", 
            courseId: courseId 
        });
    });
};

exports.updateCourse = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const { title, description, category, level, thumbnail_url } = req.body;
    
    console.log("🔄 Updating course:", courseId, "by instructor:", req.user.id);
    
    // PostgreSQL: Update parameter placeholders
    const query = "UPDATE courses SET title = $1, description = $2, category = $3, level = $4, thumbnail_url = $5 WHERE id = $6 AND instructor_id = $7";
    const values = [title, description, category, level, thumbnail_url, courseId, req.user.id];
    
    db.query(query, values, (err, result) => {
        if (err) {
            console.error("❌ Update error:", err);
            return res.status(500).json({ error: err.message });
        }
        
        console.log("📊 Update result rowCount:", result.rowCount);
        
        // PostgreSQL: Check rowCount instead of affectedRows
        if (result.rowCount === 0) {
            console.log("❌ No rows updated - course not found or not owner");
            return res.status(404).json({ message: "Course not found or you are not the owner." });
        }
        
        console.log("✅ Course updated successfully");
        res.json({ message: "Course updated successfully." });
    });
};

exports.deleteCourse = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    
    console.log("🗑️ Deleting course:", courseId, "by instructor:", req.user.id);
    
    // PostgreSQL: Update parameter placeholder
    const query = "DELETE FROM courses WHERE id = $1 AND instructor_id = $2";
    
    db.query(query, [courseId, req.user.id], (err, result) => {
        if (err) {
            console.error("❌ Delete error:", err);
            return res.status(500).json({ error: err.message });
        }
        
        console.log("📊 Delete result rowCount:", result.rowCount);
        
        // PostgreSQL: Check rowCount instead of affectedRows
        if (result.rowCount === 0) {
            console.log("❌ No rows deleted - course not found or not owner");
            return res.status(404).json({ message: "Course not found or you are not the owner." });
        }
        
        console.log("✅ Course deleted successfully");
        res.json({ message: "Course deleted successfully." });
    });
};

exports.updateCourseStatus = (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const { status } = req.body;
    
    console.log("🔄 Updating course status:", courseId, "to:", status, "by instructor:", req.user.id);
    
    if (status !== 'published' && status !== 'draft') {
        return res.status(400).json({ message: "Invalid status provided." });
    }
    
    // PostgreSQL: Update parameter placeholders
    const query = "UPDATE courses SET status = $1 WHERE id = $2 AND instructor_id = $3";
    
    db.query(query, [status, courseId, req.user.id], (err, result) => {
        if (err) {
            console.error("❌ Status update error:", err);
            return res.status(500).json({ error: err.message });
        }
        
        console.log("📊 Status update result rowCount:", result.rowCount);
        
        // PostgreSQL: Check rowCount instead of affectedRows
        if (result.rowCount === 0) {
            console.log("❌ No rows updated - course not found or not owner");
            return res.status(404).json({ message: "Course not found or you are not the owner." });
        }
        
        console.log("✅ Course status updated successfully");
        res.json({ message: `Course status updated to ${status}.` });
    });
};
