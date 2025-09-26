const db = require("../config/db");
const { v4: uuidv4 } = require('uuid');

// A helper function to award an achievement. ON CONFLICT DO NOTHING prevents duplicates.
const awardAchievement = (studentId, achievementId) => {
    console.log(`[Achievement] Awarding '${achievementId}' to student ID: ${studentId}`);
    // PostgreSQL: Replace INSERT IGNORE with INSERT ... ON CONFLICT DO NOTHING
    const query = "INSERT INTO achievements (student_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING";
    db.query(query, [studentId, achievementId], (err) => {
        if (err) console.error(`[Achievement] Failed to award '${achievementId}':`, err);
    });
};

// --- Generate or Retrieve a Certificate ---
exports.generateCertificate = (req, res) => {
    const studentId = req.user.id;
    const courseId = parseInt(req.params.courseId, 10);

    // PostgreSQL: Change parameter placeholders to $1, $2
    const findCertQuery = "SELECT * FROM certificates WHERE student_id = $1 AND course_id = $2";
    db.query(findCertQuery, [studentId, courseId], (err, certs) => {
        if (err) return res.status(500).json({ error: "Database error finding certificate." });
        
        // PostgreSQL: Access results via .rows array
        if (certs.rows.length > 0) {
            return res.status(200).json({ 
                message: "Certificate already exists.", 
                certificate_uid: certs.rows.certificate_uid 
            });
        }

        const checkCompletionQuery = `
            SELECT 
                (SELECT COUNT(*) FROM lessons WHERE course_id = $1) as total_lessons,
                (SELECT COUNT(*) FROM lesson_completions WHERE student_id = $2 AND course_id = $3) as completed_lessons
        `;
        db.query(checkCompletionQuery, [courseId, studentId, courseId], (err, results) => {
            if (err) return res.status(500).json({ error: "Database error checking completion." });
            
            // PostgreSQL: Access first row via .rows
            const { total_lessons, completed_lessons } = results.rows;
            
            if (total_lessons === 0 || total_lessons > completed_lessons) {
                return res.status(403).json({ message: "Course is not yet completed." });
            }

            const certificateUid = uuidv4();
            // PostgreSQL: Add RETURNING clause to get inserted data
            const insertCertQuery = "INSERT INTO certificates (student_id, course_id, certificate_uid) VALUES ($1, $2, $3) RETURNING id";
            db.query(insertCertQuery, [studentId, courseId, certificateUid], (err, result) => {
                if (err) return res.status(500).json({ error: "Failed to create certificate." });

                // --- THIS IS THE NEW, UPGRADED ACHIEVEMENT LOGIC ---
                const countCertsQuery = "SELECT COUNT(*) as cert_count FROM certificates WHERE student_id = $1";
                db.query(countCertsQuery, [studentId], (err, countResult) => {
                    if (err) return; 
                    
                    // PostgreSQL: Access count via .rows
                    const certCount = countResult.rows.cert_count;
                    
                    if (certCount >= 1) awardAchievement(studentId, 'COURSE_COMPLETION_1');
                    if (certCount >= 3) awardAchievement(studentId, 'COURSE_COMPLETION_3');
                    if (certCount >= 5) awardAchievement(studentId, 'COURSE_COMPLETION_5');

                    setTimeout(() => {
                        const countAchievementsQuery = "SELECT COUNT(*) as ach_count FROM achievements WHERE student_id = $1";
                        db.query(countAchievementsQuery, [studentId], (err, achResult) => {
                            if (!err && achResult.rows.ach_count >= 3) {
                                awardAchievement(studentId, 'BADGE_COLLECTOR_3');
                            }
                        });
                    }, 500);
                });
                // --- END ACHIEVEMENT LOGIC ---

                res.status(201).json({ 
                    message: "Certificate generated successfully!", 
                    certificate_uid: certificateUid 
                });
            });
        });
    });
};

// --- Get a Certificate's Details ---
exports.getCertificate = (req, res) => {
    const studentId = req.user.id;
    const courseId = parseInt(req.params.courseId, 10);
    
    // PostgreSQL: Update parameter placeholders
    const query = `
        SELECT u.first_name,u.last_name, c.title as course_title, cert.certificate_uid, cert.issued_at 
        FROM certificates cert 
        JOIN users u ON cert.student_id = u.id 
        JOIN courses c ON cert.course_id = c.id
        WHERE cert.student_id = $1 AND cert.course_id = $2
    `;
    db.query(query, [studentId, courseId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error." });
        
        // PostgreSQL: Check .rows array length and access first row
        if (results.rows.length === 0) return res.status(404).json({ message: "Certificate not found." });
        res.json(results.rows[0]);
    });
};
