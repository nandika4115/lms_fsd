// server/config/db.js
const { Pool } = require("pg");

// Log connection details for debugging (password masked)
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",        
  password: process.env.DB_PASSWORD || "password",            
  database: process.env.DB_NAME || "edu_platform",
  port: process.env.DB_PORT || 5432,
};

console.log(`📍 PostgreSQL Config: host=${dbConfig.host}, user=${dbConfig.user}, db=${dbConfig.database}, port=${dbConfig.port}`);

// Create a connection pool
const pool = new Pool({
  ...dbConfig,
  max: 10,                // Reduced from 20
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Add these important settings
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Test the connection with better error handling
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
    if (err.message.includes('password')) {
      console.error("⚠️  HINT: Check your DB_PASSWORD in .env file");
    }
  } else {
    console.log("✅ Connected to edu_platform PostgreSQL database...");
    release(); 
  }
});

// Critical: Handle pool errors to prevent crashes
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
  // Don't crash the process
});

// Add connection event logging
pool.on('connect', (client) => {
  console.log('🔗 New client connected to PostgreSQL');
});

pool.on('acquire', (client) => {
  console.log('📥 Client acquired from pool');
});

pool.on('remove', (client) => {
  console.log('🗑️ Client removed from pool');
});

module.exports = pool;
