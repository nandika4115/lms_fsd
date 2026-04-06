const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Use the same JWT secret for both user and admin tokens
const JWT_SECRET = process.env.JWT_SECRET || 'edu_learn_admin_secret_change_me';
const ADMIN_JWT_SECRET = JWT_SECRET;

// --- Register Admin (Seed) ---
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin with this email already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const admin = new Admin({ name, email, password: hashedPassword });
    const saved = await admin.save();

    console.log('✅ Admin registered:', email);
    res.status(201).json({ message: 'Admin created successfully.', adminId: saved._id });
  } catch (err) {
    console.error('❌ Admin registration error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// --- Login Admin ---
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = bcrypt.compareSync(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: admin._id, name: admin.name, email: admin.email, role: 'admin' },
      ADMIN_JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('✅ Admin login successful:', email);
    res.json({ token, adminId: admin._id, name: admin.name, email: admin.email });
  } catch (err) {
    console.error('❌ Admin login error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// --- Verify Admin Token ---
const verifyAdminToken = (req, res) => {
  try {
    if (req.admin) {
      res.json({
        valid: true,
        admin: {
          id: req.admin.id,
          name: req.admin.name,
          email: req.admin.email,
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({ valid: false, message: 'Invalid admin token' });
    }
  } catch (err) {
    res.status(401).json({ valid: false, message: err.message });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  verifyAdminToken
};
