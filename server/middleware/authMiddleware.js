// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

// NOTE: keep the same secret you used earlier. In production move this to process.env
const JWT_SECRET = "your_super_secret_key_that_is_long_and_random";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user; // token payload (id, username, role, etc)
    next();
  });
};

module.exports = { authenticateToken, JWT_SECRET };
