const db = require("../config/db");

// Enroll the logged-in user in a course
exports.enrollInCourse = (req, res) => {
  const studentId = req.user.id; // From authenticateToken middleware
  const { courseId } = req.params;

  // First, check if the user is already enrolled
  const checkQuery = "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?";
  db.query(checkQuery, [studentId, courseId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      return res.status(409).json({ message: "You are already enrolled in this course." });
    }

    // If not enrolled, create the new enrollment
    const insertQuery = "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)";
    db.query(insertQuery, [studentId, courseId], (err, result) => {
      if (err) {
         // Handle cases where the course might not exist
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
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

  // Join enrollments with the courses table to get course details
  const query = `
    SELECT c.id, c.title, c.description, c.category, c.instructor_id
    FROM courses c
    JOIN enrollments e ON c.id = e.course_id
    WHERE e.student_id = ?;
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Check enrollment status for a single course
exports.getEnrollmentStatus = (req, res) => {
    const studentId = req.user.id;
    const { courseId } = req.params;
    
    const query = "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?";
    db.query(query, [studentId, courseId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            res.json({ isEnrolled: true, enrollmentDetails: results[0] });
        } else {
            res.json({ isEnrolled: false });
        }
    });
};