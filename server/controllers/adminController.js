const Admin = require('../models/Admin');
const Announcement = require('../models/Announcement');
const db = require('../config/db');

const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}, '-password').lean(); // Hide password
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, pinned } = req.body;
    const createdBy = req.admin.name || req.admin.email || 'admin';
    const ann = new Announcement({ title, content, createdBy, pinned });
    const saved = await ann.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUsers = (req, res) => {
  const role = req.query.role;
  let query = 'SELECT id, username, email, role, first_name, last_name FROM users';
  const params = [];
  if (role) {
    // Use text cast to allow querying pending_instructor which might not be in enum
    query += ' WHERE role::text = $1';
    params.push(role);
  }
  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result.rows);
  });
};

// --- Admin Stats ---
const getStats = async (req, res) => {
  try {
    const totalStudentsRes = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = $1", ['student']);
    const totalInstructorsRes = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = $1", ['instructor']);
    // Query pending_instructor separately using WHERE role LIKE or text cast
    const pendingInstructorsRes = await db.query("SELECT COUNT(*) AS count FROM users WHERE role::text = $1", ['pending_instructor']);
    const totalCoursesRes = await db.query("SELECT COUNT(*) AS count FROM courses");

    const coursesPerInstructorRes = await db.query(
      `SELECT u.id AS instructor_id, u.username, COUNT(c.id) AS course_count
       FROM users u
       LEFT JOIN courses c ON u.id = c.instructor_id
       WHERE u.role = $1
       GROUP BY u.id, u.username
       ORDER BY course_count DESC
       LIMIT 50`,
      ['instructor']
    );

    res.json({
      totalStudents: parseInt(totalStudentsRes.rows[0]?.count || 0),
      totalInstructors: parseInt(totalInstructorsRes.rows[0]?.count || 0),
      pendingInstructors: parseInt(pendingInstructorsRes.rows[0]?.count || 0),
      totalCourses: parseInt(totalCoursesRes.rows[0]?.count || 0),
      coursesPerInstructor: coursesPerInstructorRes.rows
    });
  } catch (err) {
    console.error('Stats query error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// --- Approve / Reject Users (Instructor flow) ---
const approveUser = (req, res) => {
  const userId = req.params.id;
  console.log(`🔄 Approving user ${userId}...`);
  // Simply set role to 'instructor' without casting
  db.query("UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role", ['instructor', userId], (err, result) => {
    if (err) {
      console.error('❌ Approve error:', err.message);
      console.error('Error details:', err);
      return res.status(500).json({ error: err.message, details: err.detail });
    }
    if (!result.rows || result.rows.length === 0) {
      console.log(`⚠️ User ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(`✅ User ${userId} approved successfully`);
    res.json(result.rows[0]);
  });
};

const rejectUser = (req, res) => {
  const userId = req.params.id;
  console.log(`🔄 Rejecting user ${userId}...`);
  // Mark as rejected to preserve record
  db.query("UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role", ['rejected', userId], (err, result) => {
    if (err) {
      console.error('❌ Reject error:', err.message);
      console.error('Error details:', err);
      return res.status(500).json({ error: err.message, details: err.detail });
    }
    if (!result.rows || result.rows.length === 0) {
      console.log(`⚠️ User ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(`✅ User ${userId} rejected successfully`);
    res.json(result.rows[0]);
  });
};

const deleteUser = (req, res) => {
  const userId = req.params.id;
  
  // Delete the user from the database
  db.query("DELETE FROM users WHERE id = $1 RETURNING id, username, email", [userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.rows || result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully', user: result.rows[0] });
  });
};

module.exports = {
  getAdmins,
  getAnnouncements,
  createAnnouncement,
  getUsers,
  getStats,
  approveUser,
  rejectUser,
  deleteUser
};
