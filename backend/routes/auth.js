const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { userId: user.user_id, role: user.role, campusId: user.campus_id || 1 },
            process.env.JWT_SECRET || 'supersecretjwtkey_12345',
            { expiresIn: '1d' }
        );

        let prn = null;
        if (user.role === 'STUDENT') {
            const [stu] = await db.execute('SELECT prn FROM Students WHERE user_id = ?', [user.user_id]);
            if (stu.length > 0) prn = stu[0].prn;
        } else if (user.role === 'PARENT') {
            const [child] = await db.execute('SELECT student_prn FROM Parent_Student WHERE parent_user_id = ?', [user.user_id]);
            if (child.length > 0) prn = child[0].student_prn;
        }

        res.json({ token, role: user.role, userId: user.user_id, email: user.email, prn });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/register (Admin only)
router.post('/register', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { email, password, role, campus_id } = req.body;
    if (!['ADMIN', 'FACULTY', 'STUDENT', 'PARENT'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be ADMIN, FACULTY, STUDENT, or PARENT' });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO Users (campus_id, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [campus_id || 1, email, hash, role]
        );
        res.status(201).json({ message: 'User registered', userId: result.insertId });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/auth/me — get current user info
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT user_id, campus_id, email, role, created_at FROM Users WHERE user_id = ?',
            [req.user.userId]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
