const db = require("../config/db");

// 1. Define ALL your functions as constants

const getProfile = (req, res) => {
    const userId = req.user.id;
    const query = "SELECT * FROM users WHERE id = ?";

    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: "User not found" });

        const userProfile = results[0];
        delete userProfile.password;
        res.json(userProfile);
    });
};

const updateProfile = (req, res) => {
    const userId = req.user.id;
    const { first_name, last_name, username, email, phone_number, age, current_activity, activity_place } = req.body;

    const query = `
        UPDATE users 
        SET first_name = ?, last_name = ?, username = ?, email = ?, phone_number = ?, age = ?, current_activity = ?, activity_place = ? 
        WHERE id = ?
    `;
    const values = [first_name, last_name, username, email, phone_number, age, current_activity, activity_place, userId];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json({ message: "Profile updated successfully." });
    });
};

// Add a placeholder for the function you're exporting but haven't written yet
const uploadProfilePicture = (req, res) => {
    res.status(501).json({ message: "Profile picture upload not implemented yet." });
};


// 2. Export them all together in one object
module.exports = { 
    getProfile, 
    updateProfile, 
    uploadProfilePicture 
};

