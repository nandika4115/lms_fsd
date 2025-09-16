const db = require("../config/db");

// A security helper function to ensure the user making a request is the course owner.
const verifyCourseOwner = (courseId, instructorId, callback) => {
    console.log("🔍 Verifying ownership - Course:", courseId, "Instructor:", instructorId);
    
    // PostgreSQL: Update parameter placeholder
    const query = "SELECT instructor_id FROM courses WHERE id = $1";
    db.query(query, [courseId], (err, results) => {
        if (err) {
            console.error("❌ Database error in verifyCourseOwner:", err);
            return callback(err);
        }
        
        console.log("📊 Ownership query results:", results.rows);
        
        // PostgreSQL: Check .rows array length and access first row
        if (results.rows.length === 0) {
            console.log("❌ Course not found:", courseId);
            return callback(new Error("Course not found."));
        }
        
        const courseInstructorId = results.rows[0].instructor_id;
        console.log("👤 Course owner ID:", courseInstructorId, "Current user ID:", instructorId);
        console.log("👤 Types - Course owner:", typeof courseInstructorId, "Current user:", typeof instructorId);
        
        // FIX: Ensure both are same type for comparison
        if (parseInt(courseInstructorId) !== parseInt(instructorId)) {
            console.log("❌ Ownership verification failed");
            return callback(new Error("User is not the owner of this course."));
        }
        
        console.log("✅ Ownership verified successfully");
        callback(null); // Success
    });
};

// --- Add a new lesson to a course (as Instructor) ---
exports.addLesson = (req, res) => {
    const instructorId = req.user.id;
    const courseId = parseInt(req.params.courseId, 10);
    const { title, content_url } = req.body;

    console.log("🔄 Adding lesson to course:", courseId, "by instructor:", instructorId);

    verifyCourseOwner(courseId, instructorId, (err) => {
        if (err) {
            console.log("❌ Ownership verification failed:", err.message);
            return res.status(403).json({ message: "Permission denied: " + err.message });
        }

        // PostgreSQL: Update parameter placeholder
        const orderQuery = "SELECT MAX(lesson_order) as max_order FROM lessons WHERE course_id = $1";
        db.query(orderQuery, [courseId], (err, orderResult) => {
            if (err) {
                console.error("❌ Error getting lesson order:", err);
                return res.status(500).json({ error: err.message });
            }
            
            // PostgreSQL: Access via .rows[0]
            const newOrder = (orderResult.rows[0]?.max_order || 0) + 1;
            console.log("📊 New lesson order will be:", newOrder);

            // PostgreSQL: Add RETURNING clause and update parameter placeholders
            const insertQuery = "INSERT INTO lessons (course_id, title, content, lesson_order) VALUES ($1, $2, $3, $4) RETURNING id";
            const values = [courseId, title, content_url, newOrder];

            db.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error("❌ Error inserting lesson:", err);
                    return res.status(500).json({ error: err.message });
                }
                
                // PostgreSQL: Access inserted ID via result.rows[0].id
                const lessonId = result.rows[0].id;
                console.log("✅ Lesson added successfully with ID:", lessonId);
                
                res.status(201).json({ message: "Lesson added successfully", lessonId: lessonId });
            });
        });
    });
};

// --- Get all lessons for a specific course ---
exports.getLessonsByCourse = (req, res) => {
    const courseId = parseInt(req.params.courseId, 10);
    
    console.log("🔄 Getting lessons for course:", courseId);
    
    // PostgreSQL: Update parameter placeholder
    db.query("SELECT * FROM lessons WHERE course_id = $1 ORDER BY lesson_order ASC", [courseId], (err, results) => {
        if (err) {
            console.error("❌ Error getting lessons:", err);
            return res.status(500).json({ error: err.message });
        }
        
        console.log("📊 Found", results.rows.length, "lessons");
        // PostgreSQL: Return results.rows array
        res.json(results.rows);
    });
};

// --- Update a lesson's details (as Instructor) ---
exports.updateLesson = (req, res) => {
    const instructorId = req.user.id;
    const lessonId = parseInt(req.params.lessonId, 10);
    const { title, content_url } = req.body;

    console.log("🔄 Updating lesson:", lessonId, "by instructor:", instructorId);

    // PostgreSQL: Update parameter placeholder
    const lessonQuery = "SELECT course_id FROM lessons WHERE id = $1";
    db.query(lessonQuery, [lessonId], (err, lessons) => {
        if (err) {
            console.error("❌ Error finding lesson:", err);
            return res.status(500).json({ error: err.message });
        }
        
        // PostgreSQL: Check .rows array length
        if (lessons.rows.length === 0) {
            console.log("❌ Lesson not found:", lessonId);
            return res.status(404).json({ message: "Lesson not found." });
        }
        
        // PostgreSQL: Access via .rows[0]
        const courseId = lessons.rows[0].course_id;
        console.log("📊 Lesson belongs to course:", courseId);
        
        verifyCourseOwner(courseId, instructorId, (err) => {
            if (err) {
                console.log("❌ Ownership verification failed:", err.message);
                return res.status(403).json({ message: "Permission denied: " + err.message });
            }

            // PostgreSQL: Update parameter placeholders
            const updateQuery = "UPDATE lessons SET title = $1, content = $2 WHERE id = $3";
            db.query(updateQuery, [title, content_url, lessonId], (err, result) => {
                if (err) {
                    console.error("❌ Error updating lesson:", err);
                    return res.status(500).json({ error: err.message });
                }
                
                console.log("✅ Lesson updated successfully");
                res.json({ message: "Lesson updated successfully." });
            });
        });
    });
};

// --- Delete a lesson (as Instructor) ---
exports.deleteLesson = (req, res) => {
    const instructorId = req.user.id;
    const lessonId = parseInt(req.params.lessonId, 10);

    console.log("🗑️ Deleting lesson:", lessonId, "by instructor:", instructorId);

    // PostgreSQL: Update parameter placeholder
    const lessonQuery = "SELECT course_id FROM lessons WHERE id = $1";
    db.query(lessonQuery, [lessonId], (err, lessons) => {
        if (err) {
            console.error("❌ Error finding lesson:", err);
            return res.status(500).json({ error: err.message });
        }
        
        // PostgreSQL: Check .rows array length
        if (lessons.rows.length === 0) {
            console.log("❌ Lesson not found:", lessonId);
            return res.status(404).json({ message: "Lesson not found." });
        }

        // PostgreSQL: Access via .rows[0]
        const courseId = lessons.rows[0].course_id;
        
        verifyCourseOwner(courseId, instructorId, (err) => {
            if (err) {
                console.log("❌ Ownership verification failed:", err.message);
                return res.status(403).json({ message: "Permission denied: " + err.message });
            }

            // PostgreSQL: Update parameter placeholder
            const deleteQuery = "DELETE FROM lessons WHERE id = $1";
            db.query(deleteQuery, [lessonId], (err, result) => {
                if (err) {
                    console.error("❌ Error deleting lesson:", err);
                    return res.status(500).json({ error: err.message });
                }
                
                console.log("✅ Lesson deleted successfully");
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

    console.log("🔄 Reordering lessons for course:", courseId);

    verifyCourseOwner(courseId, instructorId, (err) => {
        if (err) {
            console.log("❌ Ownership verification failed:", err.message);
            return res.status(403).json({ message: "Permission denied: " + err.message });
        }

        // PostgreSQL: Use transaction approach for multiple updates
        const executeReorder = async () => {
            try {
                await db.query('BEGIN');
                
                for (let i = 0; i < orderedLessonIds.length; i++) {
                    const lessonId = orderedLessonIds[i];
                    const newOrder = i + 1;
                    await db.query(
                        "UPDATE lessons SET lesson_order = $1 WHERE id = $2 AND course_id = $3",
                        [newOrder, lessonId, courseId]
                    );
                }
                
                await db.query('COMMIT');
                console.log("✅ Lessons reordered successfully");
                res.json({ message: "Lesson order updated successfully." });
            } catch (error) {
                await db.query('ROLLBACK');
                console.error("❌ Error reordering lessons:", error);
                res.status(500).json({ error: error.message });
            }
        };
        
        executeReorder();
    });
};

// --- Get a single lesson by its own ID (with Security Check) ---
exports.getLessonById = (req, res) => {
    const lessonId = parseInt(req.params.lessonId, 10);
    const studentId = req.user?.id; 

    console.log("🔄 Getting lesson:", lessonId, "for user:", studentId);

    if (!studentId) {
        return res.status(401).json({ message: "You must be logged in to view a lesson." });
    }

    // PostgreSQL: Update parameter placeholder
    const findCourseQuery = "SELECT course_id FROM lessons WHERE id = $1";
    db.query(findCourseQuery, [lessonId], (err, lessons) => {
        if (err) {
            console.error("❌ Error finding lesson:", err);
            return res.status(500).json({ error: "Database error finding lesson." });
        }
        
        // PostgreSQL: Check .rows array length
        if (lessons.rows.length === 0) {
            console.log("❌ Lesson not found:", lessonId);
            return res.status(404).json({ message: "Lesson not found." });
        }
        
        // PostgreSQL: Access via .rows[0]
        const courseId = lessons.rows[0].course_id;

        // PostgreSQL: Update parameter placeholders
        const verifyEnrollmentQuery = "SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2";
        db.query(verifyEnrollmentQuery, [studentId, courseId], (err, enrollments) => {
            if (err) {
                console.error("❌ Error checking enrollment:", err);
                return res.status(500).json({ error: "Database error checking enrollment." });
            }
            
            // PostgreSQL: Check .rows array length
            if (enrollments.rows.length === 0) {
                console.log("❌ User not enrolled in course");
                return res.status(403).json({ message: "You must be enrolled in this course to view its lessons." });
            }

            // PostgreSQL: Update parameter placeholder
            db.query("SELECT * FROM lessons WHERE id = $1", [lessonId], (err, lessonDetails) => {
                if (err) {
                    console.error("❌ Error getting lesson details:", err);
                    return res.status(500).json({ error: "Database error fetching lesson." });
                }
                
                // PostgreSQL: Check .rows array length and access first row
                if (lessonDetails.rows.length === 0) {
                    return res.status(404).json({ message: "Lesson not found" });
                }
                
                console.log("✅ Lesson retrieved successfully");
                res.json(lessonDetails.rows[0]);
            });
        });
    });
};

// --- Mark a lesson as complete (as Student) ---
exports.markLessonComplete = (req, res) => {
    const studentId = req.user.id;
    const lessonId = parseInt(req.params.lessonId, 10);

    console.log("🔄 Marking lesson complete:", lessonId, "for student:", studentId);

    // PostgreSQL: Update parameter placeholder
    const findCourseQuery = "SELECT course_id FROM lessons WHERE id = $1";
    db.query(findCourseQuery, [lessonId], (err, lessons) => {
        if (err) {
            console.error("❌ Error finding lesson:", err);
            return res.status(500).json({ error: "Database error finding lesson." });
        }
        
        // PostgreSQL: Check .rows array length
        if (lessons.rows.length === 0) {
            console.log("❌ Lesson not found:", lessonId);
            return res.status(404).json({ message: "Lesson not found." });
        }
        
        // PostgreSQL: Access via .rows[0]
        const courseId = lessons.rows[0].course_id;

        // PostgreSQL: Update parameter placeholders
        const verifyEnrollmentQuery = "SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2";
        db.query(verifyEnrollmentQuery, [studentId, courseId], (err, enrollments) => {
            if (err) {
                console.error("❌ Error checking enrollment:", err);
                return res.status(500).json({ error: "Database error checking enrollment." });
            }
            
            // PostgreSQL: Check .rows array length
            if (enrollments.rows.length === 0) {
                console.log("❌ User not enrolled in course");
                return res.status(403).json({ message: "You must be enrolled in this course to complete lessons." });
            }

            // PostgreSQL: Replace INSERT IGNORE with INSERT ... ON CONFLICT DO NOTHING
            const insertQuery = "INSERT INTO lesson_completions (student_id, lesson_id, course_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING";
            db.query(insertQuery, [studentId, lessonId, courseId], (err, result) => {
                if (err) {
                    console.error("❌ Error marking lesson complete:", err);
                    return res.status(500).json({ error: "Database error marking complete." });
                }
                
                console.log("✅ Lesson marked complete successfully");
                res.status(201).json({ message: "Lesson marked as complete." });
            });
        });
    });
};
