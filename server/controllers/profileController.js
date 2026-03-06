const db = require("../config/db");

// --- Get Profile ---
const getProfile = (req, res) => {
    const userId = req.user.id;
    const query = "SELECT * FROM users WHERE id = $1";

    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.rows.length === 0) return res.status(404).json({ message: "User not found" });

        const userProfile = results.rows[0];
        delete userProfile.password;
        res.json(userProfile);
    });
};

// --- Update Profile ---
const updateProfile = (req, res) => {
    const userId = req.user.id;
    const { first_name, last_name, username, email, phone_number, age, current_activity, activity_place } = req.body;

    const query = `
        UPDATE users 
        SET first_name = $1, last_name = $2, username = $3, email = $4, phone_number = $5, age = $6, current_activity = $7, activity_place = $8 
        WHERE id = $9
    `;
    const values = [first_name, last_name, username, email, phone_number, age, current_activity, activity_place, userId];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        // PostgreSQL: Check rowCount instead of affectedRows
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found or no changes made." });
        }
        res.json({ message: "Profile updated successfully." });
    });
};

// --- Upload Profile Picture (Not Implemented) ---
const uploadProfilePicture = (req, res) => {
    res.status(501).json({ message: "Profile picture upload not implemented yet." });
};

// --- Export ---
module.exports = { 
    getProfile, 
    updateProfile, 
    uploadProfilePicture 
};
