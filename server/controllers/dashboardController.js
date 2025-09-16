const db = require("../config/db");
const moment = require('moment');

// A helper function to award achievements safely using callbacks
const awardAchievement = (studentId, achievementId) => {
    console.log(`[Achievement] Attempting to award '${achievementId}' to student ID: ${studentId}`);
    
    // PostgreSQL: Replace INSERT IGNORE with INSERT ... ON CONFLICT DO NOTHING
    const query = "INSERT INTO achievements (student_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING";
    db.query(query, [studentId, achievementId], (err, result) => {
        if (err) {
            console.error(`[Achievement] Failed to award '${achievementId}' for student ${studentId}:`, err);
        } else {
            console.log(`[Achievement] Successfully processed '${achievementId}' for student ${studentId}`);
        }
    });
};

// --- Main dashboard data endpoint ---
exports.getDashboard = (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log("🔄 Dashboard request for user:", userId, "role:", userRole);

        if (userRole === 'student') {
            getStudentDashboardData(userId, (err, data) => {
                if (err) {
                    console.error("STUDENT DASHBOARD ERROR:", err);
                    return res.status(500).json({ error: "Failed to load student dashboard data." });
                }
                console.log("✅ Student dashboard data prepared successfully");
                res.json(data);
            });
        } else if (userRole === 'instructor') {
            getInstructorDashboardData(userId, (err, data) => {
                if (err) {
                    console.error("INSTRUCTOR DASHBOARD ERROR:", err);
                    return res.status(500).json({ error: "Failed to load instructor dashboard data." });
                }
                console.log("✅ Instructor dashboard data prepared successfully");
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
const getStudentDashboardData = (studentId, callback) => {
    let studentData = {};

    console.log("📊 StudentDashboard: fetching data for studentId =", studentId);

    // 1. Enrolled courses & progress - PostgreSQL: Update parameter placeholders
    const enrolledCoursesQuery = `
        SELECT c.id AS course_id,
               c.title AS course_title,
               c.thumbnail_url,
               COALESCE((SELECT COUNT(*) FROM lessons WHERE course_id = c.id), 0) AS total_lessons,
               COALESCE((SELECT COUNT(*) FROM lesson_completions lc WHERE lc.student_id = $1 AND lc.course_id = c.id), 0) AS completed_lessons,
               (
                   SELECT l.id
                   FROM lessons l
                   WHERE l.course_id = c.id
                     AND l.id NOT IN (
                         SELECT lc2.lesson_id
                         FROM lesson_completions lc2
                         WHERE lc2.student_id = $2 AND lc2.course_id = c.id
                     )
                   ORDER BY COALESCE(l.lesson_order, l.id) ASC
                   LIMIT 1
               ) AS resumeLessonId
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = $3;
    `;

    db.query(enrolledCoursesQuery, [studentId, studentId, studentId], (err, enrolledCourses) => {
        if (err) {
            console.error("❌ Error in enrolledCoursesQuery:", err);
            return callback(err);
        }
        
        // PostgreSQL: Access via .rows array
        studentData.enrolledCourses = enrolledCourses.rows || [];
        console.log("📚 Found", studentData.enrolledCourses.length, "enrolled courses");

        // 2. Learning streak - PostgreSQL: Update parameter placeholder
        const streakQuery = `
            SELECT DISTINCT DATE(completed_at) AS completion_date
            FROM lesson_completions
            WHERE student_id = $1
            ORDER BY completion_date DESC
        `;
        db.query(streakQuery, [studentId], (err, completionRows) => {
            if (err) {
                console.error("❌ Error in streakQuery:", err);
                return callback(err);
            }

            // PostgreSQL: Access via .rows array
            const completionDates = new Set(
                completionRows.rows.map(r => moment(r.completion_date).format('YYYY-MM-DD')).filter(d => d)
            );
            
            let learningStreak = 0;
            if (completionDates.size > 0) {
                let current = moment();
                while (completionDates.has(current.format('YYYY-MM-DD'))) {
                    learningStreak++;
                    current.subtract(1, 'days');
                }
            }
            studentData.learningStreak = learningStreak;
            console.log("🔥 Learning streak:", learningStreak, "days");

            // 3. Certificate count - PostgreSQL: Update parameter placeholder
            const certCountQuery = `SELECT COUNT(*) AS certificate_count FROM certificates WHERE student_id = $1`;
            db.query(certCountQuery, [studentId], (err, certCountRows) => {
                if (err) {
                    console.error("❌ Error in certCountQuery:", err);
                    return callback(err);
                }
                
                // FIX: PostgreSQL - Access via .rows[0].certificate_count
                const certificateCount = parseInt(certCountRows.rows[0]?.certificate_count) || 0;
                studentData.certificateCount = certificateCount;

                console.log("🏆 Certificate count for student:", studentId, "=", certificateCount);

                // 4. Achievements awarding based on certificate count
                if (certificateCount >= 1) awardAchievement(studentId, 'COURSE_COMPLETION_1');
                if (certificateCount >= 3) awardAchievement(studentId, 'COURSE_COMPLETION_3');
                if (certificateCount >= 5) awardAchievement(studentId, 'COURSE_COMPLETION_5');

                // 5. Fetch current achievements - PostgreSQL: Update parameter placeholder
                const achievementsQuery = `SELECT achievement_id FROM achievements WHERE student_id = $1`;
                db.query(achievementsQuery, [studentId], (err, achievementsRows) => {
                    if (err) {
                        console.error("❌ Error in achievementsQuery:", err);
                        return callback(err);
                    }
                    
                    // PostgreSQL: Access via .rows array
                    const achievementIds = achievementsRows.rows.map(r => r.achievement_id);
                    studentData.achievements = achievementIds;
                    
                    console.log("🏅 Current achievements for student:", studentId, "=", achievementIds);
                    
                    // Award badge collector achievement
                    if (achievementIds.length >= 3) {
                        awardAchievement(studentId, 'BADGE_COLLECTOR_3');
                    }

                    // 6. Recommendations with Fallback - PostgreSQL: Update parameter placeholders
                    const recommendationsQuery = `
                        SELECT c.* FROM courses c
                        WHERE c.status = 'published'
                          AND c.id NOT IN (SELECT course_id FROM enrollments WHERE student_id = $1)
                          AND c.category IN (
                              SELECT DISTINCT c2.category FROM courses c2
                              JOIN enrollments e2 ON c2.id = e2.course_id
                              WHERE e2.student_id = $2
                          )
                        ORDER BY (SELECT COUNT(*) FROM enrollments e3 WHERE e3.course_id = c.id) DESC
                        LIMIT 3;
                    `;
                    
                    db.query(recommendationsQuery, [studentId, studentId], (err, recRows) => {
                        if (err) {
                            console.error("❌ Error in recommendationsQuery:", err);
                            return callback(err);
                        }

                        console.log("🎯 Personalized recommendations found:", recRows.rows?.length || 0);

                        // PostgreSQL: Access via .rows array and check length
                        if (recRows.rows && recRows.rows.length > 0) {
                            studentData.recommendations = recRows.rows;
                            console.log("📚 Final student data summary:", {
                                enrolledCourses: studentData.enrolledCourses.length,
                                certificateCount: studentData.certificateCount,
                                achievements: studentData.achievements.length,
                                recommendations: studentData.recommendations.length,
                                learningStreak: studentData.learningStreak
                            });
                            return callback(null, studentData);
                        }
                        
                        // If no personalized recommendations, run fallback query for popular courses
                        console.log("🔄 No personalized recommendations, trying fallback...");
                        const fallbackQuery = `
                            SELECT c.* FROM courses c
                            WHERE c.status = 'published'
                              AND c.id NOT IN (SELECT course_id FROM enrollments WHERE student_id = $1)
                            ORDER BY (SELECT COUNT(*) FROM enrollments e3 WHERE e3.course_id = c.id) DESC
                            LIMIT 3;
                        `;
                        db.query(fallbackQuery, [studentId], (err, fallbackRows) => {
                            if (err) {
                                console.error("❌ Error in fallbackQuery:", err);
                                return callback(err);
                            }
                            
                            console.log("🎯 Fallback recommendations found:", fallbackRows.rows?.length || 0);
                            
                            // PostgreSQL: Access via .rows array
                            studentData.recommendations = fallbackRows.rows || [];
                            
                            console.log("📚 Final student data summary:", {
                                enrolledCourses: studentData.enrolledCourses.length,
                                certificateCount: studentData.certificateCount,
                                achievements: studentData.achievements.length,
                                recommendations: studentData.recommendations.length,
                                learningStreak: studentData.learningStreak
                            });
                            
                            callback(null, studentData);
                        });
                    });
                });
            });
        });
    });
};

// --- Instructor Dashboard Logic ---
const getInstructorDashboardData = (instructorId, callback) => {
    console.log("👨‍🏫 InstructorDashboard: fetching data for instructorId =", instructorId);
    
    // PostgreSQL: Update parameter placeholder
    const query = `
        SELECT 
            c.id AS course_id,
            c.title AS course_title,
            c.status,
            c.thumbnail_url,
            c.category,
            c.level,
            c.created_at,
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
                AND (
                    SELECT COUNT(*) 
                    FROM lessons l 
                    WHERE l.course_id = c.id
                ) > 0
            ) AS completion_count
        FROM courses c 
        WHERE c.instructor_id = $1
        ORDER BY c.created_at DESC;
    `;

    db.query(query, [instructorId], (err, results) => {
        if (err) {
            console.error("❌ Instructor dashboard query failed:", err);
            return callback(err);
        }

        console.log("📊 Found", results.rows?.length || 0, "courses for instructor");

        // PostgreSQL: Access via .rows array and map results
        const finalResults = (results.rows || []).map(course => ({
            ...course,
            lesson_count: parseInt(course.lesson_count) || 0,
            enrollment_count: parseInt(course.enrollment_count) || 0,
            completion_count: parseInt(course.completion_count) || 0
        }));

        console.log("👨‍🏫 Instructor dashboard summary:", {
            totalCourses: finalResults.length,
            totalEnrollments: finalResults.reduce((sum, course) => sum + course.enrollment_count, 0),
            totalLessons: finalResults.reduce((sum, course) => sum + course.lesson_count, 0),
            totalCompletions: finalResults.reduce((sum, course) => sum + course.completion_count, 0)
        });

        callback(null, finalResults);
    });
};
