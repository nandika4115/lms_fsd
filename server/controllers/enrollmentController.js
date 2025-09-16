const db = require("../config/db");

// Enroll the logged-in user in a course
exports.enrollInCourse = (req, res) => {
  const studentId = req.user.id; // From authenticateToken middleware
  const { courseId } = req.params;

  // First, check if the user is already enrolled - PostgreSQL: Update parameter placeholder
  const checkQuery = "SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2";
  db.query(checkQuery, [studentId, courseId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // PostgreSQL: Check .rows array length
    if (results.rows.length > 0) {
      return res.status(409).json({ message: "You are already enrolled in this course." });
    }

    // If not enrolled, create the new enrollment - PostgreSQL: Update parameter placeholders
    const insertQuery = "INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2)";
    db.query(insertQuery, [studentId, courseId], (err, result) => {
      if (err) {
         // PostgreSQL: Handle foreign key constraint violation (course doesn't exist)
        if (err.code === '23503') {
          return res.status(404).json({ message: "Course not found." });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: "Successfully enrolled in the course." });
    });
  });
};

// Get all courses a student is enrolled in
exports.getEnrolledCourses = (req, res) => {
  const studentId = req.user.id;

  // Join enrollments with the courses table to get course details - PostgreSQL: Update parameter placeholder
  const query = `
    SELECT c.id, c.title, c.description, c.category, c.instructor_id
    FROM courses c
    JOIN enrollments e ON c.id = e.course_id
    WHERE e.student_id = $1;
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    // PostgreSQL: Return results.rows array
    res.json(results.rows);
  });
};

// Check enrollment status for a single course
exports.getEnrollmentStatus = (req, res) => {
    const studentId = req.user.id;
    const { courseId } = req.params;
    
    // PostgreSQL: Update parameter placeholders
    const query = "SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2";
    db.query(query, [studentId, courseId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // PostgreSQL: Check .rows array length and access first row
        if (results.rows.length > 0) {
            res.json({ isEnrolled: true, enrollmentDetails: results.rows });
        } else {
            res.json({ isEnrolled: false });
        }
    });
};
