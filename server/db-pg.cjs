// PostgreSQL Database Connection for Railway
const { Pool } = require('pg');

// Use DATABASE_URL from Railway or fallback to local
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize database tables
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usage_logs (
                id SERIAL PRIMARY KEY,
                nama TEXT NOT NULL,
                total_income_bulanan REAL NOT NULL,
                health_score INTEGER DEFAULT 0,
                primary_focus TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ PostgreSQL database initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
};

// Initialize on startup
initDB();

module.exports = pool;
