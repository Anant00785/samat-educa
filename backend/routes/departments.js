const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET all departments with Analytics (Students/Teachers per department)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT d.dept_id, d.name,
              (SELECT count(*) FROM Students s WHERE s.dept_id = d.dept_id) as student_count,
              (SELECT count(*) FROM Faculty f WHERE f.dept_id = d.dept_id) as teacher_count
            FROM Departments d 
            ORDER BY d.name
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create department (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { name } = req.body;
    try {
        const [result] = await db.execute('INSERT INTO Departments (name) VALUES (?)', [name]);
        res.status(201).json({ dept_id: result.insertId, name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update department (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { name } = req.body;
    try {
        await db.execute('UPDATE Departments SET name = ? WHERE dept_id = ?', [name, req.params.id]);
        res.json({ message: 'Department updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE department (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        await db.execute('DELETE FROM Departments WHERE dept_id = ?', [req.params.id]);
        res.json({ message: 'Department deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
