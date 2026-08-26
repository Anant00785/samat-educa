const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/notifications — Get all alerts relevant to user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const role = req.user.role;
        const userId = req.user.userId;

        let query = `
            SELECT alert_id, user_id, target_role, student_prn, title, message, severity, type, is_read, created_at
            FROM Alerts
            WHERE (user_id = ? OR target_role = ? OR target_role = 'ALL')
        `;
        const params = [userId, role];

        // If parent, also grab alerts for their child
        if (role === 'PARENT') {
            const [childRows] = await db.execute('SELECT student_prn FROM Parent_Student WHERE parent_user_id = ?', [userId]);
            if (childRows.length > 0) {
                const childPrn = childRows[0].student_prn;
                query += ` OR (target_role = 'PARENT' AND student_prn = ?)`;
                params.push(childPrn);
            }
        }

        // If student, also grab alerts for their prn
        if (role === 'STUDENT') {
            const [stuRows] = await db.execute('SELECT prn FROM Students WHERE user_id = ?', [userId]);
            if (stuRows.length > 0) {
                const prn = stuRows[0].prn;
                query += ` OR (target_role = 'STUDENT' AND student_prn = ?)`;
                params.push(prn);
            }
        }

        query += ` ORDER BY created_at DESC LIMIT 30`;

        const [alerts] = await db.execute(query, params);
        res.json(alerts);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// PUT /api/notifications/:id/read — Mark single alert as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        await db.execute('UPDATE Alerts SET is_read = 1 WHERE alert_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
        console.error('Error updating notification:', err);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// PUT /api/notifications/read-all — Mark all as read for role
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        await db.execute('UPDATE Alerts SET is_read = 1 WHERE user_id = ? OR target_role = ?', [req.user.userId, req.user.role]);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Error marking all notifications read:', err);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

// POST /api/notifications/create — Admin or Faculty dispatch
router.post('/create', authenticateToken, authorizeRoles('ADMIN', 'FACULTY'), async (req, res) => {
    const { target_role, student_prn, title, message, severity, type } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO Alerts (target_role, student_prn, title, message, severity, type, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)',
            [target_role || 'ALL', student_prn || null, title, message, severity || 'INFO', type || 'GENERAL']
        );
        res.status(201).json({ success: true, alert_id: result.insertId, message: 'Alert broadcasted successfully' });
    } catch (err) {
        console.error('Error creating notification:', err);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

module.exports = router;
