// server/config/db.js
const { Pool } = require("pg");

// Create a connection pool
const pool = new Pool({
  host: "localhost",
  user: "postgres",        
  password: "password",            
  database: "edu_platform",
  port: 5432,             
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
