const db = require("../config/db");

// Add a new lesson to a specific course
exports.addLesson = (req, res) => {
  const { courseId } = req.params;
  const { title, content_type, content_url } = req.body;

  if (!title || !courseId) {
    return res.status(400).json({ message: "Title and course ID are required." });
  }

  const query = "INSERT INTO lessons (course_id, title, content_type, content_url) VALUES (?, ?, ?, ?)";
  const values = [courseId, title, content_type, content_url];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error adding lesson:", err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Lesson added successfully", lessonId: result.insertId });
  });
};

// Get a single lesson by its ID
exports.getLessonById = (req, res) => {
  const { lessonId } = req.params;

  db.query("SELECT * FROM lessons WHERE id = ?", [lessonId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    res.json(results[0]);
  });
};

// Get all lessons for a specific course
exports.getLessonsByCourse = (req, res) => {
  const { courseId } = req.params;
  db.query("SELECT * FROM lessons WHERE course_id = ? ORDER BY created_at ASC", [courseId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Update a lesson's details
exports.updateLesson = (req, res) => {
  const { lessonId } = req.params;
  const { title, content_type, content_url } = req.body;

  const query = "UPDATE lessons SET title = ?, content_type = ?, content_url = ? WHERE id = ?";
  const values = [title, content_type, content_url, lessonId];

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    res.json({ message: "Lesson updated successfully" });
  });
};

// Delete a lesson
exports.deleteLesson = (req, res) => {
  const { lessonId } = req.params;
  db.query("DELETE FROM lessons WHERE id = ?", [lessonId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
     if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    res.json({ message: "Lesson deleted successfully" });
  });
};