const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET all students (Admin & Faculty)
router.get('/', authenticateToken, authorizeRoles('ADMIN', 'FACULTY'), async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT s.prn, s.first_name, s.last_name, s.semester, d.name AS department, u.email
            FROM Students s
            JOIN Departments d ON s.dept_id = d.dept_id
            JOIN Users u ON s.user_id = u.user_id
            ORDER BY s.first_name
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET single student (Admin, Faculty, or the student themselves)
router.get('/:prn', authenticateToken, async (req, res) => {
    const { prn } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT s.prn, s.first_name, s.last_name, s.semester, 
                   d.name AS department, d.dept_id, u.email, u.user_id
            FROM Students s
            JOIN Departments d ON s.dept_id = d.dept_id
            JOIN Users u ON s.user_id = u.user_id
            WHERE s.prn = ?
        `, [prn]);
        if (rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create student + user account (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { prn, first_name, last_name, dept_id, semester, email, password } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const hash = await bcrypt.hash(password, 10);
        const [userResult] = await conn.execute(
            'INSERT INTO Users (email, password_hash, role) VALUES (?, ?, ?)',
            [email, hash, 'STUDENT']
        );
        await conn.execute(
            'INSERT INTO Students (prn, user_id, first_name, last_name, dept_id, semester) VALUES (?, ?, ?, ?, ?, ?)',
            [prn, userResult.insertId, first_name, last_name, dept_id, semester]
        );
        await conn.commit();
        res.status(201).json({ message: 'Student created successfully', prn });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: err.code === 'ER_DUP_ENTRY' ? 'PRN or email already exists' : 'Server error' });
    } finally {
        conn.release();
    }
});

// PUT update student (Admin only)
router.put('/:prn', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { prn } = req.params;
    const { first_name, last_name, dept_id, semester } = req.body;
    try {
        await db.execute(
            'UPDATE Students SET first_name=?, last_name=?, dept_id=?, semester=? WHERE prn=?',
            [first_name, last_name, dept_id, semester, prn]
        );
        res.json({ message: 'Student updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET student by user_id (for student's own dashboard lookup)
router.get('/by-user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT s.prn, s.first_name, s.last_name, s.semester, d.name AS department
            FROM Students s
            JOIN Departments d ON s.dept_id = d.dept_id
            WHERE s.user_id = ?
        `, [userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE student (Admin only)
router.delete('/:prn', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { prn } = req.params;
    try {
        await db.execute('DELETE FROM Students WHERE prn = ?', [prn]);
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET student wellness history (Student, Faculty, or Admin)
router.get('/wellness/history/:prn', authenticateToken, async (req, res) => {
    const { prn } = req.params;
    // Check authorization: if user is student, they can only view their own prn
    if (req.user.role === 'STUDENT') {
        const [studentRows] = await db.execute('SELECT prn FROM Students WHERE user_id = ?', [req.user.userId]);
        if (studentRows.length === 0 || studentRows[0].prn !== prn) {
            return res.status(403).json({ error: 'Access denied.' });
        }
    }
    
    try {
        const [rows] = await db.execute(`
            SELECT id, prn, mood, suggestions, created_at
            FROM Faculty_Alerts
            WHERE prn = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [prn]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching student wellness history:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
