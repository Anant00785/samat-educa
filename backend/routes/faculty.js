const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET all faculty (Admin)
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT f.faculty_id, f.first_name, f.last_name, d.name AS department, u.email
            FROM Faculty f
            JOIN Departments d ON f.dept_id = d.dept_id
            JOIN Users u ON f.user_id = u.user_id
            ORDER BY f.first_name
        `);

        // Fetch subjects for each
        for (let row of rows) {
            const [subs] = await db.execute(`
                SELECT s.name 
                FROM Teacher_Subject ts
                JOIN Subjects s ON ts.subject_id = s.subject_id
                WHERE ts.faculty_id = ?
            `, [row.faculty_id]);
            row.subjects = subs.map(s => s.name).join(', ');
        }
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET single faculty
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT f.faculty_id, f.first_name, f.last_name, f.dept_id,
                   d.name AS department, u.email, u.user_id
            FROM Faculty f
            JOIN Departments d ON f.dept_id = d.dept_id
            JOIN Users u ON f.user_id = u.user_id
            WHERE f.faculty_id = ?
        `, [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Faculty not found' });

        const [subs] = await db.execute(`
            SELECT s.subject_id, s.name 
            FROM Teacher_Subject ts
            JOIN Subjects s ON ts.subject_id = s.subject_id
            WHERE ts.faculty_id = ?
        `, [id]);
        rows[0].subjects = subs;

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET faculty by user_id (for own dashboard)
router.get('/by-user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT f.faculty_id, f.first_name, f.last_name, d.name AS department
            FROM Faculty f
            JOIN Departments d ON f.dept_id = d.dept_id
            WHERE f.user_id = ?
        `, [userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Faculty not found' });

        const [subs] = await db.execute(`
            SELECT s.subject_id, s.name 
            FROM Teacher_Subject ts
            JOIN Subjects s ON ts.subject_id = s.subject_id
            WHERE ts.faculty_id = ?
        `, [rows[0].faculty_id]);
        rows[0].subjects = subs;

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create faculty + user account (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { first_name, last_name, dept_id, email, password, subjects } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const hash = await bcrypt.hash(password, 10);
        const [userResult] = await conn.execute(
            'INSERT INTO Users (email, password_hash, role) VALUES (?, ?, ?)',
            [email, hash, 'FACULTY']
        );
        const [facResult] = await conn.execute(
            'INSERT INTO Faculty (user_id, first_name, last_name, dept_id) VALUES (?, ?, ?, ?)',
            [userResult.insertId, first_name, last_name, dept_id]
        );

        if (subjects && Array.isArray(subjects)) {
            for (let subId of subjects) {
                await conn.execute('INSERT INTO Teacher_Subject (faculty_id, subject_id) VALUES (?, ?)', [facResult.insertId, subId]);
            }
        }

        await conn.commit();
        res.status(201).json({ message: 'Faculty created', faculty_id: facResult.insertId });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: err.code === 'ER_DUP_ENTRY' || err.code === 'SQLITE_CONSTRAINT' ? 'Email already exists' : 'Server error' });
    }
});

// DELETE faculty
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        // Find user_id first to delete from Users table (cascade will handle Faculty, but let's do it manually just in case)
        const [rows] = await db.execute('SELECT user_id FROM Faculty WHERE faculty_id = ?', [req.params.id]);
        if (rows.length > 0) {
            await db.execute('DELETE FROM Users WHERE user_id = ?', [rows[0].user_id]);
        }
        res.json({ message: 'Faculty deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST mark attendance (existing — preserved)
router.post('/attendance', authenticateToken, authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
    const { prn, subject_id, faculty_id, date, status } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO Attendance (prn, subject_id, faculty_id, date, status) VALUES (?, ?, ?, ?, ?)',
            [prn, subject_id, faculty_id, date, status]
        );
        res.json({ message: 'Attendance marked successfully', attendanceId: result.insertId });
    } catch (err) {
        console.error('Error marking attendance:', err);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
});

// POST upload marks (existing — preserved)
router.post('/marks', authenticateToken, authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
    const { prn, subject_id, exam_type, score, total } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO Marks (prn, subject_id, exam_type, score, total) VALUES (?, ?, ?, ?, ?)',
            [prn, subject_id, exam_type, score, total]
        );
        res.json({ message: 'Marks uploaded successfully', markId: result.insertId });
    } catch (err) {
        console.error('Error uploading marks:', err);
        res.status(500).json({ error: 'Failed to upload marks' });
    }
});

// GET faculty alerts
router.get('/alerts/all', authenticateToken, authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT a.id, a.prn, a.mood, a.suggestions, a.created_at, s.first_name, s.last_name
            FROM Faculty_Alerts a
            JOIN Students s ON a.prn = s.prn
            ORDER BY a.created_at DESC
            LIMIT 20
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching alerts:', err);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

module.exports = router;
