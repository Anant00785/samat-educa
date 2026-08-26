const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET all subjects
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT s.*, d.name as department_name 
            FROM Subjects s 
            LEFT JOIN Departments d ON s.dept_id = d.dept_id
            ORDER BY s.name
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET subjects by department
router.get('/dept/:dept_id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM Subjects WHERE dept_id = ? ORDER BY name', [req.params.dept_id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
