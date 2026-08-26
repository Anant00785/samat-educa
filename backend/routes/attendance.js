const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET attendance records for a student
router.get('/:prn', authenticateToken, async (req, res) => {
    const { prn } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT a.attendance_id, a.date, a.status,
                   s.name AS subject, f.first_name AS faculty_first, f.last_name AS faculty_last
            FROM Attendance a
            JOIN Subjects s ON a.subject_id = s.subject_id
            JOIN Faculty f ON a.faculty_id = f.faculty_id
            WHERE a.prn = ?
            ORDER BY a.date DESC
        `, [prn]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET attendance summary (% per subject) for a student
router.get('/summary/:prn', authenticateToken, async (req, res) => {
    const { prn } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT s.name AS subject,
                   COUNT(*) AS total_classes,
                   SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present,
                   ROUND(SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS percentage
            FROM Attendance a
            JOIN Subjects s ON a.subject_id = s.subject_id
            WHERE a.prn = ?
            GROUP BY s.subject_id, s.name
        `, [prn]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST mark attendance (Faculty/Admin)
router.post('/', authenticateToken, authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
    const { prn, subject_id, faculty_id, date, status } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO Attendance (prn, subject_id, faculty_id, date, status) VALUES (?, ?, ?, ?, ?)',
            [prn, subject_id, faculty_id, date, status]
        );
        res.status(201).json({ message: 'Attendance marked', attendance_id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST mark self attendance (Student)
router.post('/self', authenticateToken, authorizeRoles('STUDENT'), async (req, res) => {
    const { status } = req.body;
    const date = new Date().toISOString().split('T')[0];
    try {
        const [studentRows] = await db.execute('SELECT prn FROM Students WHERE user_id = ?', [req.user.userId]);
        if (studentRows.length === 0) return res.status(404).json({ error: 'Student not found' });
        const prn = studentRows[0].prn;

        // Marking for a default subject (1) and faculty (1) for general daily attendance
        const [result] = await db.execute(
            'INSERT INTO Attendance (prn, subject_id, faculty_id, date, status) VALUES (?, 1, 1, ?, ?)',
            [prn, date, status]
        );
        res.status(201).json({ message: 'Attendance marked successfully', prn });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST bulk mark attendance for a class
router.post('/bulk', authenticateToken, authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
    const { records, subject_id, faculty_id, date } = req.body;
    // records = [{ prn, status }]
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        for (const r of records) {
            await conn.execute(
                'INSERT INTO Attendance (prn, subject_id, faculty_id, date, status) VALUES (?, ?, ?, ?, ?)',
                [r.prn, subject_id, faculty_id, date, r.status]
            );
        }
        await conn.commit();
        res.status(201).json({ message: `${records.length} records saved` });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
});

module.exports = router;
