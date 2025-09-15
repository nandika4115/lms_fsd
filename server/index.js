require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // Your database connection

// --- Import all your route files ---
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const profileRoutes = require('./routes/profileRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// --- THIS IS THE FIX ---
// The error was caused by a likely typo in this path.
// This version ensures the path './routes/certificateRoutes' is spelled correctly.
const certificateRoutes = require('./routes/certificateRoutes');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Define your API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/certificates', certificateRoutes);


// Test database connection
db.query('SELECT 1', (err, results) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to edu_platform database...');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

