const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET all marks for a student
router.get('/:prn', authenticateToken, async (req, res) => {
    const { prn } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT m.mark_id, m.exam_type, m.score, m.total,
                   s.name AS subject, s.credits
            FROM Marks m
            JOIN Subjects s ON m.subject_id = s.subject_id
            WHERE m.prn = ?
            ORDER BY s.name, m.exam_type
        `, [prn]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET marks summary for a student
router.get('/summary/:prn', authenticateToken, async (req, res) => {
    const { prn } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT s.subject_id, s.name, sum(m.score) as total_score, sum(m.total) as total_max
            FROM Marks m
            JOIN Subjects s ON m.subject_id = s.subject_id
            WHERE m.prn = ?
            GROUP BY s.subject_id, s.name
        `, [prn]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST add marks (Faculty/Admin)
router.post('/', authenticateToken, authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
    const { prn, subject_id, exam_type, score, total } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO Marks (prn, subject_id, exam_type, score, total) VALUES (?, ?, ?, ?, ?)',
            [prn, subject_id, exam_type, score, total]
        );
        res.status(201).json({ message: 'Marks added', mark_id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET all students list with marks for a subject (Admin/Faculty)
router.get('/subject/:subject_id', authenticateToken, authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
    const { subject_id } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT m.mark_id, m.prn, m.exam_type, m.score, m.total,
                   s.first_name, s.last_name
            FROM Marks m
            JOIN Students s ON m.prn = s.prn
            WHERE m.subject_id = ?
            ORDER BY s.last_name
        `, [subject_id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
