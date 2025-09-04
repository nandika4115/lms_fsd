const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // Import JWT library

const app = express();

// --- Configuration and Middleware ---
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

// In a real application, this secret should be stored in an environment variable (.env file)
const JWT_SECRET = "your_super_secret_key_that_is_long_and_random";

// --- MySQL Connection ---
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "edu_platform"
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to edu_platform database...");
  }
});

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden (token is no longer valid)
    }
    req.user = user; // Add the decoded user payload to the request object
    next();
  });
};


// --- AUTHENTICATION ROUTES ---

// ---------------- REGISTER ----------------
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Username already exists" });
          }
          return res.status(500).json({ message: "Error registering user" });
        }
        res.status(201).json({ message: "✅ User registered successfully" });
      }
    );
  } catch (error) {
    return res.status(500).json({ message: "Error processing password" });
  }
});

// ---------------- LOGIN (Updated to return JWT) ----------------
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }
  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    if (err) return res.status(500).json({ message: "Error logging in" });
    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ message: "Error logging in" });
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      // ✨ Create JWT Token on successful login
      const tokenPayload = { id: user.id, username: user.username, role: user.role };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
      res.json({ message: "✅ Login successful", token });
    });
  });
});

// --- PUBLIC COURSE ROUTES ---
app.get("/api/courses", (req, res) => {
  const sql = `
        SELECT c.id, c.title, c.description, u.username AS instructor_name 
        FROM courses c JOIN users u ON c.instructor_id = u.id WHERE u.role = 'instructor'`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch courses" });
    res.json(results);
  });
});

app.get("/api/courses/:id", (req, res) => {
  const courseId = req.params.id;
  const courseSql = `
        SELECT c.id, c.title, c.description, u.username AS instructor_name 
        FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = ? AND u.role = 'instructor'`;
  const lessonsSql = "SELECT id, title FROM lessons WHERE course_id = ?";
  db.query(courseSql, [courseId], (err, courseResult) => {
    if (err) return res.status(500).json({ message: "Failed to fetch course" });
    if (courseResult.length === 0) return res.status(404).json({ message: "Course not found" });
    db.query(lessonsSql, [courseId], (err, lessonsResult) => {
      if (err) return res.status(500).json({ message: "Failed to fetch lessons" });
      const responseData = { ...courseResult[0], lessons: lessonsResult };
      res.json(responseData);
    });
  });
});


// ------------------------------------------
// ✨ NEW PROTECTED DASHBOARD ROUTE ✨
// ------------------------------------------
app.get("/api/dashboard", authenticateToken, (req, res) => {
  const { id: userId, role } = req.user; // Get user info from the decoded token

  if (role === 'student') {
    // For students: Get their enrolled courses and progress
    const sql = `
      SELECT
        c.id AS course_id,
        c.title AS course_title,
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS total_lessons,
        (SELECT COUNT(*) FROM progress p JOIN enrollments e_inner ON p.enrollment_id = e_inner.id WHERE e_inner.student_id = ? AND e_inner.course_id = c.id) AS completed_lessons
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = ?
    `;
    db.query(sql, [userId, userId], (err, results) => {
      if (err) return res.status(500).json({ message: "Error fetching student dashboard data" });
      res.json(results);
    });
  } else if (role === 'instructor') {
    // For instructors: Get the courses they've created and enrollment counts
    const sql = `
      SELECT
        c.id AS course_id,
        c.title AS course_title,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS enrollment_count,
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS lesson_count
      FROM courses c
      WHERE c.instructor_id = ?
    `;
    db.query(sql, [userId], (err, results) => {
      if (err) return res.status(500).json({ message: "Error fetching instructor dashboard data" });
      res.json(results);
    });
  } else {
    return res.status(403).json({ message: "User role not recognized" });
  }
});


// ---------------- START SERVER ----------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

