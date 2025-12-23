require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// AUTH MIDDLEWARE FOR ADMIN ROUTES
// ============================================
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }

    // Support both "Basic base64" and "Bearer password" formats
    let password = '';

    if (authHeader.startsWith('Basic ')) {
        // Basic Auth: decode base64
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
        // Format: username:password - we only care about password
        password = credentials.split(':')[1] || credentials;
    } else if (authHeader.startsWith('Bearer ')) {
        // Simple Bearer token (password as token)
        password = authHeader.split(' ')[1];
    } else {
        // Direct password in header
        password = authHeader;
    }

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    next();
};

// ============================================
// PUBLIC API ENDPOINTS
// ============================================

// POST /api/usage - Log user completion (public endpoint)
app.post('/api/usage', (req, res) => {
    try {
        const { nama, total_income_bulanan, health_score, primary_focus } = req.body;

        // Validation
        if (!nama || nama.trim() === '') {
            return res.status(400).json({ error: 'nama is required' });
        }
        if (typeof total_income_bulanan !== 'number' || total_income_bulanan < 0) {
            return res.status(400).json({ error: 'total_income_bulanan must be a positive number' });
        }

        // Insert into database
        const stmt = db.prepare(`
      INSERT INTO usage_logs (nama, total_income_bulanan, health_score, primary_focus)
      VALUES (?, ?, ?, ?)
    `);
        const result = stmt.run(
            nama.trim(),
            total_income_bulanan,
            health_score || 0,
            primary_focus || ''
        );

        res.status(201).json({
            success: true,
            id: result.lastInsertRowid,
            message: 'Usage logged successfully'
        });
    } catch (error) {
        console.error('Error logging usage:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// PROTECTED ADMIN API ENDPOINTS
// ============================================

// GET /api/admin/stats - Get admin statistics (protected)
app.get('/api/admin/stats', adminAuth, (req, res) => {
    try {
        // Total users
        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM usage_logs').get();

        // Average income
        const avgIncome = db.prepare('SELECT AVG(total_income_bulanan) as avg FROM usage_logs').get();

        // Users per day (last 30 days)
        const usersPerDay = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM usage_logs
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

        // Income distribution (ranges)
        const incomeDistribution = db.prepare(`
      SELECT 
        CASE 
          WHEN total_income_bulanan < 3000000 THEN '< 3 Juta'
          WHEN total_income_bulanan < 5000000 THEN '3-5 Juta'
          WHEN total_income_bulanan < 8000000 THEN '5-8 Juta'
          WHEN total_income_bulanan < 15000000 THEN '8-15 Juta'
          WHEN total_income_bulanan < 30000000 THEN '15-30 Juta'
          ELSE '> 30 Juta'
        END as range,
        COUNT(*) as count
      FROM usage_logs
      GROUP BY range
      ORDER BY 
        CASE range
          WHEN '< 3 Juta' THEN 1
          WHEN '3-5 Juta' THEN 2
          WHEN '5-8 Juta' THEN 3
          WHEN '8-15 Juta' THEN 4
          WHEN '15-30 Juta' THEN 5
          ELSE 6
        END
    `).all();

        // Recent entries (last 10)
        const recentEntries = db.prepare(`
      SELECT id, nama, total_income_bulanan, health_score, primary_focus, created_at
      FROM usage_logs
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

        res.json({
            totalUsers: totalUsers.count,
            averageIncome: avgIncome.avg || 0,
            usersPerDay,
            incomeDistribution,
            recentEntries
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/verify - Verify admin password (protected)
app.get('/api/admin/verify', adminAuth, (req, res) => {
    res.json({ success: true, message: 'Password verified' });
});

// DELETE /api/admin/user/:id - Delete a user entry (protected)
app.delete('/api/admin/user/:id', adminAuth, (req, res) => {
    try {
        const { id } = req.params;

        // Check if entry exists
        const entry = db.prepare('SELECT id FROM usage_logs WHERE id = ?').get(id);
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Delete entry
        db.prepare('DELETE FROM usage_logs WHERE id = ?').run(id);

        res.json({ success: true, message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 YouthFinance API Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin dashboard: http://localhost:5173/admin`);
});
