const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET fee records for a student
router.get('/:prn', authenticateToken, async (req, res) => {
    const { prn } = req.params;
    try {
        const [rows] = await db.execute(
            'SELECT * FROM Fees WHERE prn = ? ORDER BY due_date DESC',
            [prn]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST add fee record (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { prn, amount, due_date } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO Fees (prn, amount, due_date, status) VALUES (?, ?, ?, ?)',
            [prn, amount, due_date, 'PENDING']
        );
        res.status(201).json({ message: 'Fee record added', fee_id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT mark fee as paid (Admin only)
router.put('/:fee_id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { fee_id } = req.params;
    try {
        await db.execute('UPDATE Fees SET status = ? WHERE fee_id = ?', ['PAID', fee_id]);
        res.json({ message: 'Fee marked as paid' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST AI OCR mark fee as paid (Student)
router.post('/ocr-pay/:fee_id', authenticateToken, async (req, res) => {
    const { fee_id } = req.params;
    try {
        // AI has verified the document, instantly mark as paid
        await db.execute('UPDATE Fees SET status = ? WHERE fee_id = ?', ['PAID', fee_id]);
        res.json({ success: true, message: 'Fee automatically verified by AI' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET all pending fees (Admin)
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT f.*, s.first_name, s.last_name
            FROM Fees f
            JOIN Students s ON f.prn = s.prn
            ORDER BY f.due_date ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
