require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // Your PostgreSQL connection pool
const connectMongo = require('./config/db.mongo');

// --- Import all your route files ---
const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const profileRoutes = require('./routes/profileRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
// Add this import with your other route imports
const discussionRoutes = require('./routes/discussionRoutes');
// Admin routes (MongoDB-backed)
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
    origin: function (origin, callback) {
        // Allow all origins (suitable for development)
        // For production, replace '*' with specific origin: 'http://192.168.x.x:3000'
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint (doesn't require DB)
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// --- Define your API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/certificates', certificateRoutes);
// Add this route with your other API routes
app.use('/api/discussions', discussionRoutes);
// Admin API (reads/writes to MongoDB and proxies Postgres user queries)
app.use('/api/admin', adminRoutes);

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

// Connect to MongoDB (Mongoose)
connectMongo();

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});