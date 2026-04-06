// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

// Prefer reading the secret from environment; fallback to the old default for safety
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_that_is_long_and_random";

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
// --- THIS IS THE NEW MIDDLEWARE ---
// It identifies a user if a token is present but does NOT block the request if there isn't one.
const authenticateOptional = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        // If there's no token, just proceed. req.user will be undefined.
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (!err) {
            // If the token is valid, attach the user to the request.
            req.user = user;
        }
        // Whether the token is valid or not, we proceed. 
        // If invalid, req.user will remain undefined.
        next();
    });
};

module.exports = { authenticateToken, authenticateOptional };
