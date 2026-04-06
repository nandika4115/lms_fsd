// server/middleware/adminAuthMiddleware.js
const jwt = require('jsonwebtoken');

// Use same secret as auth controllers
const ADMIN_JWT_SECRET = process.env.JWT_SECRET || 'edu_learn_admin_secret_change_me';

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No admin token provided' });
  }

  jwt.verify(token, ADMIN_JWT_SECRET, (err, admin) => {
    if (err) {
      console.error('❌ Admin token verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid or expired admin token' });
    }
    req.admin = admin; // admin payload (id, name, email, role)
    next();
  });
};

module.exports = { authenticateAdmin };
