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

    // 2. PostgreSQL query with RETURNING clause to get the new user ID
    const query = `
        INSERT INTO users 
        (username, email, password, role, first_name, last_name, phone_number, age, current_activity, activity_place) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
    `;
    
    // 3. Add all new values to the query's parameter array
    const values = [
        username, email, hashedPassword, role,
        firstName, lastName, phoneNumber, age, currentActivity, activityPlace
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            // PostgreSQL duplicate key error code
            if (err.code === '23505') {
                return res.status(409).json({ message: "An account with this email already exists." });
            }
            return res.status(500).json({ error: err.message });
        }

        // PostgreSQL returns inserted data in result.rows
        const newUserId = result.rows.id;
        const token = jwt.sign(
            { id: newUserId, username: username, role: role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.status(201).json({ token, role });
    });
};

// --- Login User ---
// In authController.js - Replace your login function
exports.login = (req, res) => {
    const { email, password } = req.body;
    
    console.log("🔄 Login attempt for email:", email);
    console.log("🔄 Password provided:", !!password);
    
    // PostgreSQL: Update parameter placeholder
    db.query("SELECT * FROM users WHERE email = $1", [email], (err, results) => {
        if (err) {
            console.error("❌ Database query error:", err);
            return res.status(500).json({ error: err.message });
        }
        
        console.log("📊 Query executed successfully");
        console.log("📊 Number of users found:", results.rows.length);
        
        // PostgreSQL: Check .rows array length
        if (results.rows.length === 0) {
            console.log("❌ No user found with email:", email);
            return res.status(401).json({ message: "Invalid email or password." });
        }
        
        // PostgreSQL: Access via .rows[0]
        const user = results.rows[0];
        
        // Debug: Show the raw user object structure
        console.log("👤 Raw user object keys:", Object.keys(user));
        console.log("👤 User data:", {
            id: user.id,
            email: user.email, 
            username: user.username,
            role: user.role,
            hasPassword: !!user.password,
            passwordLength: user.password ? user.password.length : 0,
            passwordStart: user.password ? user.password.substring(0, 10) + '...' : 'NULL'
        });
        
        // Validate inputs
        if (!password) {
            console.error("❌ No password provided in request");
            return res.status(400).json({ message: "Password is required." });
        }
        
        if (!user.password) {
            console.error("❌ No password stored for user");
            return res.status(500).json({ error: "User password not found in database" });
        }
        
        console.log("🔐 About to compare passwords...");
        console.log("Input password length:", password.length);
        console.log("Stored hash length:", user.password.length);
        
        try {
            const isPasswordValid = bcrypt.compareSync(password, user.password);
            console.log("✅ Password comparison result:", isPasswordValid);
            
            if (!isPasswordValid) {
                console.log("❌ Password comparison failed - passwords don't match");
                return res.status(401).json({ message: "Invalid email or password." });
            }
            
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: "1d" }
            );
            
            console.log("🎫 Login successful, token generated for user:", user.username);
            res.json({ token, role: user.role });
            
        } catch (bcryptError) {
            console.error("❌ Bcrypt comparison error:", bcryptError);
            return res.status(500).json({ error: "Password comparison failed: " + bcryptError.message });
        }
    });
};

// --- Logout (Unchanged) ---
exports.logout = (req, res) => {
    res.json({ message: "Logged out successfully" });
};

// --- Verify Token ---
exports.verifyToken = (req, res) => {
    try {
        if (req.user) {
            res.json({
                valid: true,
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    email: req.user.email,
                    role: req.user.role,
                    exp: req.user.exp
                }
            });
        } else {
            res.status(401).json({ 
                valid: false, 
                message: 'Invalid token - no user data' 
            });
        }
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ 
            valid: false, 
            message: 'Token verification failed' 
        });
    }
};
