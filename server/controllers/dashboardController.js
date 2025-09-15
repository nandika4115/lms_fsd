const db = require("../config/db");
const moment = require('moment');

// A helper function to award achievements safely using callbacks
const awardAchievement = (studentId, achievementId) => {
    const query = "INSERT IGNORE INTO achievements (student_id, achievement_id) VALUES (?, ?)";
    db.query(query, [studentId, achievementId], (err) => {
        if (err) console.error(`[Achievement] Failed to award '${achievementId}' for student ${studentId}:`, err);
    });
};

// --- Main dashboard data endpoint ---
exports.getDashboard = (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        if (userRole === 'student') {
            getStudentDashboardData(userId, (err, data) => {
                if (err) {
                    console.error("STUDENT DASHBOARD ERROR:", err);
                    return res.status(500).json({ error: "Failed to load student dashboard data." });
                }
                res.json(data);
            });
        } else if (userRole === 'instructor') {
            getInstructorDashboardData(userId, (err, data) => {
                if (err) {
                    console.error("INSTRUCTOR DASHBOARD ERROR:", err);
                    return res.status(500).json({ error: "Failed to load instructor dashboard data." });
                }
                res.json(data);
            });
        } else {
            res.status(403).json({ message: "Unknown user role." });
        }
    } catch (e) {
        console.error("DASHBOARD CONTROLLER ERROR:", e);
        res.status(500).json({ error: "Dashboard crash." });
    }
};

// --- Student Dashboard Logic ---
// --- Student Dashboard Logic ---
const getStudentDashboardData = (studentId, callback) => {
    let studentData = {};

    console.log("StudentDashboard: studentId =", studentId);

    // 1. Enrolled courses & progress
    const enrolledCoursesQuery = `
        SELECT c.id AS course_id,
               c.title AS course_title,
               c.thumbnail_url,
               COALESCE((SELECT COUNT(*) FROM lessons WHERE course_id = c.id), 0) AS total_lessons,
               COALESCE((SELECT COUNT(*) FROM lesson_completions lc WHERE lc.student_id = ? AND lc.course_id = c.id), 0) AS completed_lessons,
               (
                   SELECT l.id
                   FROM lessons l
                   WHERE l.course_id = c.id
                     AND l.id NOT IN (
                         SELECT lc2.lesson_id
                         FROM lesson_completions lc2
                         WHERE lc2.student_id = ? AND lc2.course_id = c.id
                     )
                   ORDER BY COALESCE(l.lesson_order, l.id) ASC
                   LIMIT 1
               ) AS resumeLessonId
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = ?;
    `;

    db.query(enrolledCoursesQuery, [studentId, studentId, studentId], (err, enrolledCourses) => {
        if (err) {
            console.error("Error in enrolledCoursesQuery:", err);
            return callback(err);
        }
        studentData.enrolledCourses = enrolledCourses;

        // 2. Learning streak
        const streakQuery = `
            SELECT DISTINCT DATE(completed_at) AS completion_date
            FROM lesson_completions
            WHERE student_id = ?
            ORDER BY completion_date DESC
        `;
        db.query(streakQuery, [studentId], (err, completionRows) => {
            if (err) return callback(err);

            const completionDates = new Set(completionRows.map(r => moment(r.completion_date).format('YYYY-MM-DD')).filter(d => d));
            let learningStreak = 0;
            if (completionDates.size > 0) {
                let current = moment();
                while (completionDates.has(current.format('YYYY-MM-DD'))) {
                    learningStreak++;
                    current.subtract(1, 'days');
                }
            }
            studentData.learningStreak = learningStreak;

            // 3. Certificate count
            const certCountQuery = `SELECT COUNT(*) AS certificate_count FROM certificates WHERE student_id = ?`;
            db.query(certCountQuery, [studentId], (err, certCountRows) => {
                if (err) return callback(err);
                const certificateCount = (certCountRows[0] && certCountRows[0].certificate_count) || 0;
                studentData.certificateCount = certificateCount;

                // 4. Achievements awarding
                if (certificateCount >= 1) awardAchievement(studentId, 'COURSE_COMPLETION_1');
                if (certificateCount >= 3) awardAchievement(studentId, 'COURSE_COMPLETION_3');
                if (certificateCount >= 5) awardAchievement(studentId, 'COURSE_COMPLETION_5');

                // 5. Fetch current achievements
                const achievementsQuery = `SELECT achievement_id FROM achievements WHERE student_id = ?`;
                db.query(achievementsQuery, [studentId], (err, achievementsRows) => {
                    if (err) return callback(err);
                    const achievementIds = achievementsRows.map(r => r.achievement_id);
                    studentData.achievements = achievementIds;
                    if (achievementIds.length >= 3) awardAchievement(studentId, 'BADGE_COLLECTOR_3');

                    // ✅ --- RECOMMENDATION FIX STARTS HERE ---
                    // 6. Recommendations with Fallback
                    const recommendationsQuery = `
                        SELECT c.* FROM courses c
                        WHERE c.status = 'published'
                          AND c.id NOT IN (SELECT course_id FROM enrollments WHERE student_id = ?)
                          AND c.category IN (
                              SELECT DISTINCT c2.category FROM courses c2
                              JOIN enrollments e2 ON c2.id = e2.course_id
                              WHERE e2.student_id = ?
                          )
                        ORDER BY (SELECT COUNT(*) FROM enrollments e3 WHERE e3.course_id = c.id) DESC
                        LIMIT 3;
                    `;
                    
                    db.query(recommendationsQuery, [studentId, studentId], (err, recRows) => {
                        if (err) return callback(err);

                        // If personalized recommendations are found, use them
                        if (recRows && recRows.length > 0) {
                            studentData.recommendations = recRows;
                            return callback(null, studentData);
                        }
                        
                        // If not, run a general fallback query for the most popular courses
                        const fallbackQuery = `
                            SELECT c.* FROM courses c
                            WHERE c.status = 'published'
                              AND c.id NOT IN (SELECT course_id FROM enrollments WHERE student_id = ?)
                            ORDER BY (SELECT COUNT(*) FROM enrollments e3 WHERE e3.course_id = c.id) DESC
                            LIMIT 3;
                        `;
                        db.query(fallbackQuery, [studentId], (err, fallbackRows) => {
                            if (err) return callback(err);
                            studentData.recommendations = fallbackRows;
                            callback(null, studentData);
                        });
                    });
                    // ✅ --- RECOMMENDATION FIX ENDS HERE ---
                });
            });
        });
    });
};// --- Instructor Dashboard Logic ---
const getInstructorDashboardData = (instructorId, callback) => {
    const query = `
        SELECT 
            c.id AS course_id,
            c.title AS course_title,
            c.status,
            c.thumbnail_url,
            (
                SELECT COUNT(*) 
                FROM lessons l 
                WHERE l.course_id = c.id
            ) AS lesson_count,
            (
                SELECT COUNT(*) 
                FROM enrollments e 
                WHERE e.course_id = c.id
            ) AS enrollment_count,
            (
                SELECT COUNT(*) 
                FROM enrollments e
                WHERE e.course_id = c.id
                AND (
                    SELECT COUNT(*) 
                    FROM lesson_completions lc 
                    WHERE lc.course_id = c.id AND lc.student_id = e.student_id
                ) = (
                    SELECT COUNT(*) 
                    FROM lessons l 
                    WHERE l.course_id = c.id
                )
            ) AS completion_count
        FROM courses c 
        WHERE c.instructor_id = ?;
    `;

    db.query(query, [instructorId], (err, results) => {
        if (err) {
            console.error("Instructor dashboard query failed:", err);
            return callback(err);
        }

        const finalResults = results.map(course => ({
            ...course,
            completion_count: course.completion_count || 0
        }));

        callback(null, finalResults);
    });
};
