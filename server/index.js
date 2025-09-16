require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // Your PostgreSQL connection pool

// --- Import all your route files ---
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const profileRoutes = require('./routes/profileRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
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

// Test PostgreSQL database connection
const testConnection = async () => {
    try {
        const client = await db.connect();
        const result = await client.query('SELECT 1 as test');
        client.release();
        console.log('✅ Connected to edu_platform PostgreSQL database...');
    } catch (err) {
        console.error('❌ Error connecting to the database:', err);
    }
};

// Test the connection
testConnection();

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});