const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

let activeExam = {
    title: 'Operating Systems & AI Architecture Final',
    duration: 30,
    questions: [
        {
            text: 'Which memory allocation scheme is most vulnerable to external fragmentation?',
            optionA: 'Segmentation',
            optionB: 'Paging',
            correct: 'A'
        },
        {
            text: 'In deep learning neural networks, which activation function mitigates the vanishing gradient problem?',
            optionA: 'ReLU (Rectified Linear Unit)',
            optionB: 'Sigmoid',
            correct: 'A'
        },
        {
            text: 'What is the primary function of the Translation Lookaside Buffer (TLB)?',
            optionA: 'Cache recent virtual-to-physical address translations',
            optionB: 'Store disk swap space sectors',
            correct: 'A'
        },
        {
            text: 'Which scheduling algorithm guarantees minimum average waiting time for a set of processes?',
            optionA: 'Shortest Job First (SJF)',
            optionB: 'First Come First Served (FCFS)',
            correct: 'A'
        }
    ]
};

// GET /api/exams/active
router.get('/active', (req, res) => {
    if (activeExam) {
        res.json({ success: true, exam: activeExam });
    } else {
        res.json({ success: false, message: 'No active exam currently published.' });
    }
});

// POST /api/exams/create (Faculty only)
router.post('/create', authenticateToken, authorizeRoles('FACULTY', 'ADMIN'), (req, res) => {
    const { title, duration, questions } = req.body;
    activeExam = { title, duration, questions };
    res.json({ success: true, message: 'Exam Published to Students Successfully!' });
});

// POST /api/exams/submit (Student submit + violation recorder)
router.post('/submit', async (req, res) => {
    const { studentPrn, subject, score, aiViolations } = req.body;

    try {
        const prn = studentPrn === 'STU_CURRENT' ? 'PRN000' : (studentPrn || 'PRN000');
        const violationsStr = aiViolations && aiViolations !== 'None' ? aiViolations : null;

        if (violationsStr) {
            const violationTypes = violationsStr.split('|').map(v => v.trim()).filter(Boolean);
            for (let vType of violationTypes) {
                await db.execute(`
                    INSERT INTO Exam_Violations (student_prn, subject, score, violation_type, details, severity)
                    VALUES (?, ?, ?, ?, ?, 'HIGH')
                `, [prn, subject || 'Proctored Exam', score || 0, vType, `Real-time PoseNet/Screen Proctor detected: ${vType}`]);
            }

            // Also dispatch high-priority faculty alert
            await db.execute(`
                INSERT INTO Alerts (target_role, student_prn, title, message, severity, type, is_read)
                VALUES ('FACULTY', ?, 'Exam Integrity Violation Flagged', ?, 'HIGH', 'EXAM_VIOLATION', 0)
            `, [prn, `Student ${prn} flagged for ${violationTypes.join(', ')} during ${subject}. Score: ${score}%`]);
        }

        res.json({ success: true, message: 'Exam and proctoring audit recorded successfully.' });
    } catch (err) {
        console.error('Error submitting exam:', err);
        res.status(500).json({ error: 'Failed to submit exam.' });
    }
});

// GET /api/exams/violations (Faculty & Admin review panel)
router.get('/violations', authenticateToken, authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
    try {
        const [violations] = await db.execute(`
            SELECT v.violation_id, v.student_prn, v.subject, v.score, v.violation_type, v.details, v.severity, v.created_at,
                   s.first_name, s.last_name, d.name as department
            FROM Exam_Violations v
            LEFT JOIN Students s ON v.student_prn = s.prn
            LEFT JOIN Departments d ON s.dept_id = d.dept_id
            ORDER BY v.created_at DESC
            LIMIT 50
        `);

        res.json(violations);
    } catch (err) {
        console.error('Error fetching exam violations:', err);
        res.status(500).json({ error: 'Failed to fetch violations' });
    }
});

module.exports = router;
