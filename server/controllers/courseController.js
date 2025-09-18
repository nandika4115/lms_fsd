const db = require("../config/db");

// Helper function to execute database queries with Promise
const queryDB = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, result) => {
            if (err) reject(err);
            else resolve(result.rows || result);
        });
    });
};

// Helper function for error responses
const sendError = (res, status, message, error = null) => {
    if (error) console.error(`❌ ${message}:`, error);
    return res.status(status).json({ error: message });
};

// --- Get All Public Courses (with Search, Filtering, and Resume Logic) ---
exports.getCourses = async (req, res) => {
    try {
        const studentId = req.user?.id;
        const { search, category, level } = req.query;

        let selectClause = "SELECT c.*";
        let whereClauses = ["c.status = 'published'"];
        const queryParams = [];

        // Add resume lesson subquery for logged-in students
        if (studentId) {
            selectClause += `, (
                SELECT l.id FROM lessons l
                WHERE l.course_id = c.id 
                  AND l.id NOT IN (SELECT lc.lesson_id FROM lesson_completions lc WHERE lc.student_id = $1)
                ORDER BY COALESCE(l.lesson_order, l.id) ASC LIMIT 1
            ) as resumeLessonId`;
            queryParams.push(studentId);
        }

        // Add filters
        if (search) {
            whereClauses.push(`c.title ILIKE $${queryParams.length + 1}`);
            queryParams.push(`%${search}%`);
        }
        if (category) {
            whereClauses.push(`c.category = $${queryParams.length + 1}`);
            queryParams.push(category);
        }
        if (level) {
            whereClauses.push(`c.level = $${queryParams.length + 1}`);
            queryParams.push(level);
        }

        const finalQuery = `${selectClause} FROM courses c WHERE ${whereClauses.join(' AND ')} ORDER BY c.created_at DESC`;
        const results = await queryDB(finalQuery, queryParams);
        
        res.json(results);
    } catch (err) {
        sendError(res, 500, "Failed to load courses", err);
    }
};

// --- Get Dynamic Filter Options (PostgreSQL version with enum casting) ---
exports.getCourseFilters = (req, res) => {
    console.log("🔄 Fetching course filters...");

    const categoriesQuery = `
        SELECT DISTINCT category 
        FROM courses 
        WHERE status = 'published' 
          AND category IS NOT NULL 
          AND category != '' 
        ORDER BY category ASC
    `;

    // ✅ Cast enum to text to avoid query errors
    const levelsQuery = `
        SELECT DISTINCT level::text AS level
        FROM courses 
        WHERE status = 'published' 
          AND level IS NOT NULL 
        ORDER BY level ASC
    `;

    let filters = {};

    db.query(categoriesQuery, (err, categoriesResult) => {
        if (err) {
            console.error("❌ Categories query error:", err.stack);
            return res.status(500).json({ error: "Failed to fetch categories", details: err.message });
        }

        console.log("📊 Categories result:", categoriesResult.rows);
        filters.categories = categoriesResult.rows.map(c => c.category);

        db.query(levelsQuery, (err, levelsResult) => {
            if (err) {
                console.error("❌ Levels query error:", err.stack);
                return res.status(500).json({ error: "Failed to fetch levels", details: err.message });
            }

            console.log("📊 Levels result:", levelsResult.rows);
            filters.levels = levelsResult.rows.map(l => l.level);

            console.log("✅ Final filters:", filters);
            res.json(filters);
        });
    });
};



// --- Get Single Course by ID ---
exports.getCourseById = async (req, res) => {
    try {
        const courseId = parseInt(req.params.id, 10);
        const studentId = req.user?.id;
        const userRole = req.user?.role;

        if (isNaN(courseId)) {
            return res.status(400).json({ message: "Invalid Course ID." });
        }

        // Get course with instructor info
        const courseResults = await queryDB(`
            SELECT courses.*, users.username as instructor_name 
            FROM courses JOIN users ON courses.instructor_id = users.id 
            WHERE courses.id = $1`, [courseId]);

        if (courseResults.length === 0) {
            return res.status(404).json({ message: "Course not found." });
        }

        const courseData = courseResults[0];
        const lessons = await queryDB("SELECT id, course_id, title, lesson_order, content FROM lessons WHERE course_id = $1 ORDER BY lesson_order ASC", [courseId]);

        // Check enrollment for students
        const isEnrolled = userRole === 'student' && studentId ? 
            (await queryDB("SELECT 1 FROM enrollments WHERE student_id = $1 AND course_id = $2", [studentId, courseId])).length > 0 : 
            false;

        if (!isEnrolled) {
            courseData.lessons = lessons.map(lesson => ({ ...lesson, content: null }));
            return res.json(courseData);
        }

        // Get completion status for enrolled students
        const completedLessons = await queryDB("SELECT lesson_id FROM lesson_completions WHERE student_id = $1 AND course_id = $2", [studentId, courseId]);
        const completedIds = new Set(completedLessons.map(l => l.lesson_id));
        
        const lessonsWithStatus = lessons.map(lesson => ({
            ...lesson,
            is_completed: completedIds.has(lesson.id)
        }));

        courseData.resumeLessonId = lessonsWithStatus.find(l => !l.is_completed)?.id || null;
        courseData.lessons = lessonsWithStatus;
        res.json(courseData);

    } catch (err) {
        sendError(res, 500, "Database error fetching course", err);
    }
};

// --- Create Course ---
exports.createCourse = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { title, description, category, level, thumbnail_url } = req.body;
        
        console.log("🔄 Creating course for instructor:", instructorId);
        
        const result = await queryDB(
            "INSERT INTO courses (title, description, category, level, thumbnail_url, status, instructor_id) VALUES ($1, $2, $3, $4, $5, 'draft', $6) RETURNING id",
            [title, description, category, level, thumbnail_url, instructorId]
        );
        
        const courseId = result[0].id;
        console.log("✅ Course created with ID:", courseId);
        
        res.status(201).json({ message: "Course created successfully", courseId });
    } catch (err) {
        sendError(res, 500, "Course creation failed", err);
    }
};

// --- Update Course ---
exports.updateCourse = async (req, res) => {
    try {
        const courseId = parseInt(req.params.id, 10);
        const { title, description, category, level, thumbnail_url } = req.body;
        
        console.log("🔄 Updating course:", courseId);
        
        const result = await db.query(
            "UPDATE courses SET title = $1, description = $2, category = $3, level = $4, thumbnail_url = $5 WHERE id = $6 AND instructor_id = $7",
            [title, description, category, level, thumbnail_url, courseId, req.user.id]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Course not found or you are not the owner." });
        }
        
        console.log("✅ Course updated successfully");
        res.json({ message: "Course updated successfully." });
    } catch (err) {
        sendError(res, 500, "Course update failed", err);
    }
};

// --- Delete Course ---
exports.deleteCourse = async (req, res) => {
    try {
        const courseId = parseInt(req.params.id, 10);
        
        console.log("🗑️ Deleting course:", courseId);
        
        const result = await db.query("DELETE FROM courses WHERE id = $1 AND instructor_id = $2", [courseId, req.user.id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Course not found or you are not the owner." });
        }
        
        console.log("✅ Course deleted successfully");
        res.json({ message: "Course deleted successfully." });
    } catch (err) {
        sendError(res, 500, "Course deletion failed", err);
    }
};

// --- Update Course Status ---
exports.updateCourseStatus = async (req, res) => {
    try {
        const courseId = parseInt(req.params.id, 10);
        const { status } = req.body;
        
        if (status !== 'published' && status !== 'draft') {
            return res.status(400).json({ message: "Invalid status provided." });
        }
        
        console.log("🔄 Updating course status:", courseId, "to:", status);
        
        const result = await db.query("UPDATE courses SET status = $1 WHERE id = $2 AND instructor_id = $3", [status, courseId, req.user.id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Course not found or you are not the owner." });
        }
        
        console.log("✅ Course status updated successfully");
        res.json({ message: `Course status updated to ${status}.` });
    } catch (err) {
        sendError(res, 500, "Status update failed", err);
    }
};
