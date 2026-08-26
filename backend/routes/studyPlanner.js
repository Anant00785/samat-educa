const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/study-planner/:prn — Fetch tasks and exam schedule
router.get('/:prn', authenticateToken, async (req, res) => {
    const { prn } = req.params;
    try {
        const [tasks] = await db.execute(`
            SELECT plan_id, prn, subject_name, topic, target_date, status, priority, estimated_hours, xp_reward, created_at
            FROM Study_Plans
            WHERE prn = ?
            ORDER BY 
                CASE priority 
                    WHEN 'URGENT' THEN 1 
                    WHEN 'HIGH' THEN 2 
                    WHEN 'MEDIUM' THEN 3 
                    ELSE 4 
                END,
                target_date ASC
        `, [prn]);

        // Upcoming exams mock list based on student subjects
        const [subjects] = await db.execute(`
            SELECT s.name as subject_name
            FROM Students stu
            JOIN Subjects s ON stu.dept_id = s.dept_id
            WHERE stu.prn = ?
        `, [prn]);

        const upcomingExams = subjects.slice(0, 3).map((s, idx) => ({
            id: idx + 1,
            subject: s.subject_name,
            examDate: new Date(Date.now() + (idx + 3) * 86400000).toISOString().split('T')[0],
            daysLeft: idx + 3,
            type: idx === 0 ? 'Mid-Term Assessment' : 'Practical Lab Evaluation'
        }));

        res.json({
            tasks,
            upcomingExams,
            totalCompleted: tasks.filter(t => t.status === 'COMPLETED').length,
            totalPending: tasks.filter(t => t.status !== 'COMPLETED').length
        });
    } catch (err) {
        console.error('Error fetching study planner:', err);
        res.status(500).json({ error: 'Failed to fetch study plans' });
    }
});

// POST /api/study-planner/generate — Auto-generate prioritized tasks based on performance
router.post('/generate', authenticateToken, async (req, res) => {
    const { prn } = req.body;
    try {
        // Fetch student's marks to find lowest scoring subjects
        const [marks] = await db.execute(`
            SELECT s.name as subject_name, m.score, m.total
            FROM Marks m
            JOIN Subjects s ON m.subject_id = s.subject_id
            WHERE m.prn = ?
            ORDER BY (m.score / m.total) ASC
        `, [prn]);

        const weakSubject = marks[0]?.subject_name || 'Operating Systems & Architecture';

        const newTasks = [
            {
                subject: weakSubject,
                topic: 'Deep-dive Review on Core Exam Concepts & Past Papers',
                priority: 'URGENT',
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                hours: 3,
                xp: 100
            },
            {
                subject: 'Data Structures & Algorithms',
                topic: 'Solve 3 Dynamic Programming & Graph Problems',
                priority: 'HIGH',
                date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
                hours: 2,
                xp: 75
            },
            {
                subject: 'Cloud Computing & Microservices',
                topic: 'Hands-on Containerization Lab Exercise',
                priority: 'MEDIUM',
                date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
                hours: 1,
                xp: 50
            }
        ];

        for (let t of newTasks) {
            await db.execute(`
                INSERT INTO Study_Plans (prn, subject_name, topic, target_date, status, priority, estimated_hours, xp_reward)
                VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?)
            `, [prn, t.subject, t.topic, t.date, t.priority, t.hours, t.xp]);
        }

        res.json({ success: true, message: 'AI Adaptive Study Plan refreshed with new target tasks!' });
    } catch (err) {
        console.error('Error generating study tasks:', err);
        res.status(500).json({ error: 'Failed to generate study tasks' });
    }
});

// PUT /api/study-planner/:planId/status — Toggle status & award Gamification XP
router.put('/:planId/status', authenticateToken, async (req, res) => {
    const { planId } = req.params;
    const { status, prn } = req.body;
    try {
        await db.execute('UPDATE Study_Plans SET status = ? WHERE plan_id = ?', [status, planId]);

        let xpGained = 0;
        if (status === 'COMPLETED' && prn) {
            xpGained = 75;
            // Award XP to student gamification profile
            await db.execute(`
                UPDATE Gamification 
                SET xp_points = xp_points + ?, streak_days = streak_days + 1, updated_at = CURRENT_TIMESTAMP
                WHERE prn = ?
            `, [xpGained, prn]);
        }

        res.json({ success: true, message: 'Task updated', xpGained });
    } catch (err) {
        console.error('Error updating task status:', err);
        res.status(500).json({ error: 'Failed to update task status' });
    }
});

// POST /api/study-planner/add-custom — Add custom task
router.post('/add-custom', authenticateToken, async (req, res) => {
    const { prn, subject_name, topic, target_date, priority, estimated_hours } = req.body;
    try {
        const [result] = await db.execute(`
            INSERT INTO Study_Plans (prn, subject_name, topic, target_date, status, priority, estimated_hours, xp_reward)
            VALUES (?, ?, ?, ?, 'PENDING', ?, ?, 50)
        `, [prn, subject_name, topic, target_date, priority || 'MEDIUM', estimated_hours || 2]);

        res.status(201).json({ success: true, plan_id: result.insertId, message: 'Custom study task added!' });
    } catch (err) {
        console.error('Error adding custom task:', err);
        res.status(500).json({ error: 'Failed to add custom task' });
    }
});

module.exports = router;
