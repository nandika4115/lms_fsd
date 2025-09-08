const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

// --- Configuration and Middleware ---
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

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
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- AUTHENTICATION ROUTES ---
app.post("/api/auth/register", async (req, res) => {
    const { 
    firstName, lastName, username, email, password, role, 
    phoneNumber, age, currentActivity, activityPlace 
  } = req.body;
  if (!firstName || !lastName || !username || !email || !password || !role) {
    return res.status(400).json({ message: "Please fill all required fields." });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO users (first_name, last_name, username, email, password, role, phone_number, age, current_activity, activity_place) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      firstName, lastName, username, email, hashedPassword, role, 
      phoneNumber, age, currentActivity, activityPlace
    ];
    db.query(sql, values, (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Username or Email already exists." });
        }
        return res.status(500).json({ message: "Error registering user" });
      }
      const newUser = { id: result.insertId, username, role, name: firstName, profile_image_url: null };
      const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '1h' });
      res.status(201).json({ message: "✅ User registered successfully", token });
    });
  } catch (error) {
    return res.status(500).json({ message: "Error processing request" });
  }
});

app.post("/api/auth/login", (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
        return res.status(400).json({ message: "Identifier and password required" });
    }
    const sql = "SELECT * FROM users WHERE username = ? OR email = ?";
    db.query(sql, [identifier, identifier], (err, results) => {
        if (err) return res.status(500).json({ message: "Error logging in" });
        if (results.length === 0) return res.status(401).json({ message: "Invalid credentials" });
        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ message: "Error logging in" });
            if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
            const tokenPayload = { 
                id: user.id, 
                username: user.username, 
                role: user.role, 
                name: user.first_name,
                profile_image_url: user.profile_image_url 
            };
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

// --- PROTECTED DASHBOARD & ENROLLMENT ROUTES ---
app.get("/api/dashboard", authenticateToken, (req, res) => {
    const { id: userId, role } = req.user;
    if (role === 'student') {
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
app.post('/api/enroll', authenticateToken, (req, res) => {
    const { courseId } = req.body;
    const { id: studentId, role } = req.user;
    if (role !== 'student') {
        return res.status(403).json({ message: "Only students can enroll in courses." });
    }
    if (!courseId) {
        return res.status(400).json({ message: "Course ID is required." });
    }
    const sql = "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)";
    db.query(sql, [studentId, courseId], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: "You are already enrolled in this course." });
            }
            return res.status(500).json({ message: "An error occurred during enrollment." });
        }
        res.status(201).json({ message: "Successfully enrolled in the course!" });
    });
});
app.get('/api/enrollments', authenticateToken, (req, res) => {
    const { id: studentId, role } = req.user;
    if (role !== 'student') {
        return res.json([]);
    }
    const sql = "SELECT course_id FROM enrollments WHERE student_id = ?";
    db.query(sql, [studentId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "An error occurred while fetching enrollments." });
        }
        const courseIds = results.map(row => row.course_id);
        res.json(courseIds);
    });
});


// --- PROTECTED PROFILE ROUTES ---
app.get('/api/profile', authenticateToken, (req, res) => {
    const { id: userId } = req.user;
    const sql = `
        SELECT id, first_name, last_name, username, email, role, profile_image_url,
               phone_number, age, current_activity, activity_place, created_at 
        FROM users 
        WHERE id = ?
    `;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching user profile." });
        if (results.length === 0) return res.status(404).json({ message: "User not found." });
        res.json(results[0]);
    });
});
app.post('/api/profile/picture', authenticateToken, (req, res) => {
    const { id: userId } = req.user;
    const { imageUrl } = req.body;
    if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required." });
    }
    const sql = "UPDATE users SET profile_image_url = ? WHERE id = ?";
    db.query(sql, [imageUrl, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to update profile picture." });
        }
        res.json({ message: "Profile picture updated successfully!" });
    });
});
app.put('/api/profile', authenticateToken, (req, res) => {
    const { id: userId } = req.user;
    const { firstName, lastName, phoneNumber, age, currentActivity, activityPlace } = req.body;
    if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required." });
    }
    const sql = `
        UPDATE users 
        SET first_name = ?, last_name = ?, phone_number = ?, age = ?, 
            current_activity = ?, activity_place = ?
        WHERE id = ?
    `;
    const values = [firstName, lastName, phoneNumber, age, currentActivity, activityPlace, userId];
    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "An error occurred while updating your profile." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json({ message: "Profile updated successfully!" });
    });
});

// --- INSTRUCTOR CONTENT CREATION ROUTES ---
app.post('/api/courses', authenticateToken, (req, res) => {
    const { id: instructorId, role } = req.user;
    const { title, description } = req.body;
    if (role !== 'instructor') {
        return res.status(403).json({ message: "You are not authorized to create courses." });
    }
    if (!title || !description) {
        return res.status(400).json({ message: "Title and description are required." });
    }
    const sql = "INSERT INTO courses (title, description, instructor_id) VALUES (?, ?, ?)";
    db.query(sql, [title, description, instructorId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to create course." });
        }
        res.status(201).json({ message: "Course created successfully!", courseId: result.insertId });
    });
});
app.post('/api/courses/:courseId/lessons', authenticateToken, (req, res) => {
    const { id: instructorId, role } = req.user;
    const { courseId } = req.params;
    const { title, content } = req.body;
    if (role !== 'instructor') {
        return res.status(403).json({ message: "You are not authorized to add lessons." });
    }
    if (!title) {
        return res.status(400).json({ message: "Lesson title is required." });
    }
    const verifyOwnershipSql = "SELECT instructor_id FROM courses WHERE id = ?";
    db.query(verifyOwnershipSql, [courseId], (err, results) => {
        if (err) return res.status(500).json({ message: "Server error." });
        if (results.length === 0 || results[0].instructor_id !== instructorId) {
            return res.status(403).json({ message: "You can only add lessons to your own courses." });
        }
        const insertLessonSql = "INSERT INTO lessons (course_id, title, content) VALUES (?, ?, ?)";
        db.query(insertLessonSql, [courseId, title, content || ''], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to add lesson." });
            }
            res.status(201).json({ message: "Lesson added successfully!" });
        });
    });
});
app.get('/api/lessons/:lessonId', authenticateToken, (req, res) => {
    const { id: studentId, role } = req.user;
    const { lessonId } = req.params;
    if (role !== 'student') {
        return res.status(403).json({ message: "Only students can view lessons." });
    }
    const verificationSql = `
        SELECT l.id
        FROM lessons l
        JOIN enrollments e ON l.course_id = e.course_id
        WHERE l.id = ? AND e.student_id = ?
    `;
    db.query(verificationSql, [lessonId, studentId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Server error." });
        }
        if (results.length === 0) {
            return res.status(403).json({ message: "You are not enrolled in the course for this lesson." });
        }
        const lessonSql = "SELECT id, title, content FROM lessons WHERE id = ?";
        db.query(lessonSql, [lessonId], (err, lessonResult) => {
            if (err) {
                return res.status(500).json({ message: "Server error." });
            }
            if (lessonResult.length === 0) {
                return res.status(404).json({ message: "Lesson not found." });
            }
            res.json(lessonResult[0]);
        });
    });
});

// ---------------- START SERVER ----------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});