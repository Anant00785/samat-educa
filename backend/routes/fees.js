const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/fees/my — Logged in student's fee status & overview
router.get('/my', authenticateToken, async (req, res) => {
    try {
        let prn = null;
        if (req.user.role === 'STUDENT') {
            const [stu] = await db.execute('SELECT prn FROM Students WHERE user_id = ?', [req.user.userId]);
            if (stu.length > 0) prn = stu[0].prn;
        } else if (req.user.role === 'PARENT') {
            const [child] = await db.execute('SELECT student_prn FROM Parent_Student WHERE parent_user_id = ?', [req.user.userId]);
            if (child.length > 0) prn = child[0].student_prn;
        }

        if (!prn) return res.status(404).json({ error: 'No associated student PRN found' });

        const [rows] = await db.execute(`
            SELECT f.*, s.first_name, s.last_name, d.name as department
            FROM Fees f
            JOIN Students s ON f.prn = s.prn
            JOIN Departments d ON s.dept_id = d.dept_id
            WHERE f.prn = ?
            ORDER BY f.due_date DESC
        `, [prn]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/fees/admin/analytics — Real database aggregation for admin fee portal
router.get('/admin/analytics', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const [allFees] = await db.execute(`
            SELECT f.*, s.first_name, s.last_name, s.dept_id, d.name as department
            FROM Fees f
            JOIN Students s ON f.prn = s.prn
            JOIN Departments d ON s.dept_id = d.dept_id
        `);

        const totalStudents = new Set(allFees.map(f => f.prn)).size;
        let totalBilled = 0;
        let totalCollected = 0;
        let pendingCount = 0;
        let paidCount = 0;
        let overdueCount = 0;

        const todayStr = new Date().toISOString().split('T')[0];

        // Department-wise map
        const deptMap = {};

        allFees.forEach(f => {
            const total = Number(f.total_amount || f.amount || 50000);
            const paid = Number(f.paid_amount || (f.status === 'PAID' ? total : 0));
            totalBilled += total;
            totalCollected += paid;

            const isOverdue = f.status !== 'PAID' && f.due_date < todayStr;
            if (isOverdue) overdueCount += 1;
            if (f.status === 'PAID') paidCount += 1;
            else pendingCount += 1;

            const dName = f.department || 'General';
            if (!deptMap[dName]) {
                deptMap[dName] = { department: dName, students: new Set(), totalBilled: 0, totalCollected: 0, paidCount: 0, pendingCount: 0 };
            }
            deptMap[dName].students.add(f.prn);
            deptMap[dName].totalBilled += total;
            deptMap[dName].totalCollected += paid;
            if (f.status === 'PAID') deptMap[dName].paidCount += 1;
            else deptMap[dName].pendingCount += 1;
        });

        const totalPending = Math.max(0, totalBilled - totalCollected);
        const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

        const departmentStats = Object.values(deptMap).map(d => ({
            department: d.department,
            studentCount: d.students.size,
            totalBilled: d.totalBilled,
            totalCollected: d.totalCollected,
            totalPending: Math.max(0, d.totalBilled - d.totalCollected),
            collectionRate: d.totalBilled > 0 ? Math.round((d.totalCollected / d.totalBilled) * 100) : 0,
            paidCount: d.paidCount,
            pendingCount: d.pendingCount
        }));

        res.json({
            summary: {
                totalStudents,
                totalBilled,
                totalCollected,
                totalPending,
                collectionRate: `${collectionRate}%`,
                paidInvoices: paidCount,
                pendingInvoices: pendingCount,
                overdueInvoices: overdueCount
            },
            departmentStats,
            allInvoices: allFees
        });

    } catch (err) {
        console.error('Error calculating fee analytics:', err);
        res.status(500).json({ error: 'Server error calculating fee analytics' });
    }
});

// GET /api/fees/admin/overdue — List all overdue fees
router.get('/admin/overdue', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const [rows] = await db.execute(`
            SELECT f.*, s.first_name, s.last_name, d.name as department
            FROM Fees f
            JOIN Students s ON f.prn = s.prn
            JOIN Departments d ON s.dept_id = d.dept_id
            WHERE f.status != 'PAID' AND f.due_date < ?
            ORDER BY f.due_date ASC
        `, [todayStr]);

        const overdueWithDays = rows.map(f => {
            const dueDate = new Date(f.due_date);
            const today = new Date();
            const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
            return {
                ...f,
                daysOverdue: Math.max(1, diffDays),
                remainingAmount: Number(f.total_amount || f.amount || 50000) - Number(f.paid_amount || 0)
            };
        });

        res.json(overdueWithDays);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching overdue records' });
    }
});

// POST /api/fees/admin/send-reminder — Dispatch fee reminder alert
router.post('/admin/send-reminder', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { fee_id } = req.body;
    try {
        const [rows] = await db.execute(`
            SELECT f.*, s.first_name, s.last_name, s.user_id as student_user_id
            FROM Fees f
            JOIN Students s ON f.prn = s.prn
            WHERE f.fee_id = ?
        `, [fee_id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Fee record not found' });
        const fee = rows[0];
        const studentName = `${fee.first_name} ${fee.last_name}`;

        // Student Alert
        await db.execute(`
            INSERT INTO Alerts (user_id, target_role, student_prn, title, message, severity, type)
            VALUES (?, 'STUDENT', ?, 'Semester Fee Reminder', ?, 'HIGH', 'FEE_REMINDER')
        `, [
            fee.student_user_id,
            fee.prn,
            `Action Required: Semester ${fee.semester || 5} fee of ₹${Number(fee.total_amount || fee.amount || 50000).toLocaleString()} is pending. Please complete payment via Razorpay.`
        ]);

        // Parent Alert
        const [parentRows] = await db.execute(`
            SELECT parent_user_id FROM Parent_Student WHERE student_prn = ?
        `, [fee.prn]);
        if (parentRows.length > 0) {
            await db.execute(`
                INSERT INTO Alerts (user_id, target_role, student_prn, title, message, severity, type)
                VALUES (?, 'PARENT', ?, 'Child Fee Reminder', ?, 'HIGH', 'FEE_REMINDER')
            `, [
                parentRows[0].parent_user_id,
                fee.prn,
                `Fee Reminder: Semester fee for ${studentName} (${fee.prn}) is pending. View details in Parent Portal.`
            ]);
        }

        res.json({ success: true, message: `Fee reminder alert dispatched to ${studentName} and parent.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error dispatching reminder' });
    }
});

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
    const { prn, amount, due_date, semester = 5, description = 'Semester Tuition & Lab Fee' } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO Fees (prn, amount, total_amount, paid_amount, semester, due_date, status, description) VALUES (?, ?, ?, 0, ?, ?, ?, ?)',
            [prn, amount, amount, semester, due_date, 'PENDING', description]
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
        await db.execute('UPDATE Fees SET status = ?, paid_amount = total_amount WHERE fee_id = ?', ['PAID', fee_id]);
        res.json({ message: 'Fee marked as paid' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET all fees (Admin)
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT f.*, s.first_name, s.last_name, d.name as department
            FROM Fees f
            JOIN Students s ON f.prn = s.prn
            JOIN Departments d ON s.dept_id = d.dept_id
            ORDER BY f.due_date ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
