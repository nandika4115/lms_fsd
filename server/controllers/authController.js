const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_that_is_long_and_random";

// --- ✅ UPDATED: Register User ---
// Now accepts and saves all fields from the registration form
exports.register = (req, res) => {
    // 1. Destructure all fields from the request body
    const {
        username, email, password, role,
        firstName, lastName, phoneNumber, age, currentActivity, activityPlace
    } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: "Core fields (username, email, password, role) are required." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // 2. Update the SQL query to include all new columns
    // NOTE: Assumes DB columns are named like 'first_name', 'last_name', etc.
    const query = `
        INSERT INTO users 
        (username, email, password, role, first_name, last_name, phone_number, age, current_activity, activity_place) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // 3. Add all new values to the query's parameter array
    const values = [
        username, email, hashedPassword, role,
        firstName, lastName, phoneNumber, age, currentActivity, activityPlace
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: "An account with this email already exists." });
            }
            return res.status(500).json({ error: err.message });
        }

        const newUserId = result.insertId;
        const token = jwt.sign(
            { id: newUserId, username: username, role: role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.status(201).json({ token, role });
    });
};

// --- Login User (Unchanged but included for completeness) ---
exports.login = (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        const user = results[0];
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.json({ token, role: user.role });
    });
};

// --- Logout (Unchanged) ---
exports.logout = (req, res) => {
    res.json({ message: "Logged out successfully" });
};

