const db = require("../config/db");

exports.getDashboard = (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole === 'student') {
    // This query provides all necessary data for the student dashboard
    const query = `
      SELECT 
        c.id as course_id,
        c.title as course_title,
        c.thumbnail_url,
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
        0 as completed_lessons -- Placeholder for progress tracking
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = ?;
    `;
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("STUDENT DASHBOARD SQL ERROR:", err);
        return res.status(500).json({ error: "Database query failed." });
      }
      res.json(results);
    });

  } else if (userRole === 'instructor') {
    // This query provides all necessary data for the instructor dashboard
    const query = `
      SELECT 
        c.id as course_id,
        c.title as course_title,
        c.thumbnail_url,
        c.status,
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count
      FROM courses c
      WHERE c.instructor_id = ?;
    `;
    db.query(query, [userId], (err, results) => {
      if (err) {
          console.error("INSTRUCTOR DASHBOARD SQL ERROR:", err);
          return res.status(500).json({ error: "Database query failed." });
      }
      res.json(results);
    });

  } else {
    res.status(403).json({ message: "Unknown user role." });
  }
};
