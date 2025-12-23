require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db-pg.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());

// ============================================
// AUTH MIDDLEWARE FOR ADMIN ROUTES
// ============================================
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }

    let password = '';

    if (authHeader.startsWith('Basic ')) {
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
        password = credentials.split(':')[1] || credentials;
    } else if (authHeader.startsWith('Bearer ')) {
        password = authHeader.split(' ')[1];
    } else {
        password = authHeader;
    }

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    next();
};

// ============================================
// HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'YouthFinance API Server' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// ============================================
// PUBLIC API ENDPOINTS
// ============================================

// POST /api/usage - Log user completion (public endpoint)
app.post('/api/usage', async (req, res) => {
    try {
        const { nama, total_income_bulanan, health_score, primary_focus } = req.body;

        if (!nama || nama.trim() === '') {
            return res.status(400).json({ error: 'nama is required' });
        }
        if (typeof total_income_bulanan !== 'number' || total_income_bulanan < 0) {
            return res.status(400).json({ error: 'total_income_bulanan must be a positive number' });
        }

        const result = await pool.query(
            `INSERT INTO usage_logs (nama, total_income_bulanan, health_score, primary_focus)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [nama.trim(), total_income_bulanan, health_score || 0, primary_focus || '']
        );

        res.status(201).json({
            success: true,
            id: result.rows[0].id,
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
app.get('/api/admin/stats', adminAuth, async (req, res) => {
    try {
        // Total users
        const totalUsers = await pool.query('SELECT COUNT(*) as count FROM usage_logs');

        // Average income
        const avgIncome = await pool.query('SELECT AVG(total_income_bulanan) as avg FROM usage_logs');

        // Users per day (last 30 days)
        const usersPerDay = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM usage_logs
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // Income distribution
        const incomeDistribution = await pool.query(`
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
            ORDER BY MIN(total_income_bulanan)
        `);

        // Recent entries (last 10)
        const recentEntries = await pool.query(`
            SELECT id, nama, total_income_bulanan, health_score, primary_focus, created_at
            FROM usage_logs
            ORDER BY created_at DESC
            LIMIT 10
        `);

        res.json({
            totalUsers: parseInt(totalUsers.rows[0].count),
            averageIncome: parseFloat(avgIncome.rows[0].avg) || 0,
            usersPerDay: usersPerDay.rows,
            incomeDistribution: incomeDistribution.rows,
            recentEntries: recentEntries.rows
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
app.delete('/api/admin/user/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const checkEntry = await pool.query('SELECT id FROM usage_logs WHERE id = $1', [id]);
        if (checkEntry.rows.length === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        await pool.query('DELETE FROM usage_logs WHERE id = $1', [id]);

        res.json({ success: true, message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 YouthFinance API Server running on port ${PORT}`);
});
