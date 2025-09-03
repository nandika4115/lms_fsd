const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

// Explicitly configure CORS to accept requests from your React app's origin
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200, // Some legacy browsers need this
};
app.use(cors(corsOptions));
app.use(express.json());

// MySQL connection (XAMPP)
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "edu_platform"
});

// Connect to DB
db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to edu_platform database...");
  }
});

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
          console.error("❌ Register error:", err);
          return res.status(500).json({ message: "Error registering user" });
        }
        res.status(201).json({ message: "✅ User registered successfully" });
      }
    );
  } catch (error) {
    console.error("❌ Hashing error:", error);
    return res.status(500).json({ message: "Error processing password" });
  }
});

// ---------------- LOGIN ----------------
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    if (err) {
      console.error("❌ Login error:", err);
      return res.status(500).json({ message: "Error logging in" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = results[0];
    
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error("❌ Password compare error:", err);
        return res.status(500).json({ message: "Error logging in" });
      }
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      res.json({ message: "✅ Login successful" });
    });
  });
});

// ---------------- START SERVER ----------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});