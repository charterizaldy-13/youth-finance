const Database = require('better-sqlite3');
const path = require('path');

// Create database file in server directory
const dbPath = path.join(__dirname, 'usage.db');
const db = new Database(dbPath);

// Create usage_logs table
db.exec(`
  CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    total_income_bulanan REAL NOT NULL,
    health_score INTEGER DEFAULT 0,
    primary_focus TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: Add new columns if they don't exist (for existing databases)
try {
  db.exec(`ALTER TABLE usage_logs ADD COLUMN health_score INTEGER DEFAULT 0`);
} catch (e) {
  // Column already exists
}
try {
  db.exec(`ALTER TABLE usage_logs ADD COLUMN primary_focus TEXT DEFAULT ''`);
} catch (e) {
  // Column already exists
}

console.log('Database initialized at:', dbPath);

module.exports = db;

