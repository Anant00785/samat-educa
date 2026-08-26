const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * GET /api/student-360/:prn
 * Aggregates all ERP dimensions into one live Digital Twin intelligence profile.
 */
router.get('/:prn', authenticateToken, async (req, res) => {
    const { prn } = req.params;

    // Strict RBAC Verification
    if (req.user.role === 'STUDENT') {
        const [stu] = await db.execute('SELECT prn FROM Students WHERE user_id = ?', [req.user.userId]);
        if (stu.length === 0 || stu[0].prn !== prn) {
            return res.status(403).json({ error: 'Access denied: You can only view your own Student 360 profile.' });
        }
    } else if (req.user.role === 'PARENT') {
        const [child] = await db.execute('SELECT student_prn FROM Parent_Student WHERE parent_user_id = ?', [req.user.userId]);
        if (child.length === 0 || child[0].student_prn !== prn) {
            return res.status(403).json({ error: 'Access denied: You can only view your linked child profile.' });
        }
    }

    try {
        // 1. Student Identity & Campus Info
        const [studentRows] = await db.execute(`
            SELECT s.prn, s.first_name, s.last_name, s.semester, s.dept_id, 
                   d.name AS department, u.email, c.name AS campus_name, c.code AS campus_code, c.location AS campus_location
            FROM Students s
            JOIN Departments d ON s.dept_id = d.dept_id
            JOIN Users u ON s.user_id = u.user_id
            LEFT JOIN Campuses c ON s.campus_id = c.campus_id
            WHERE s.prn = ?
        `, [prn]);

        if (studentRows.length === 0) {
            return res.status(404).json({ error: 'Student record not found in university database.' });
        }
        const student = studentRows[0];

        // 2. Attendance Intelligence
        const [attRows] = await db.execute(`
            SELECT a.status, a.date, s.name AS subject_name
            FROM Attendance a
            JOIN Subjects s ON a.subject_id = s.subject_id
            WHERE a.prn = ?
            ORDER BY a.date ASC
        `, [prn]);

        const totalClasses = attRows.length;
        const presentClasses = attRows.filter(a => a.status === 'PRESENT').length;
        const attendanceScore = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 85;

        // Subject-wise attendance
        const subjectAttMap = {};
        attRows.forEach(a => {
            if (!subjectAttMap[a.subject_name]) subjectAttMap[a.subject_name] = { total: 0, present: 0 };
            subjectAttMap[a.subject_name].total += 1;
            if (a.status === 'PRESENT') subjectAttMap[a.subject_name].present += 1;
        });

        const subjectAttendance = Object.keys(subjectAttMap).map(name => ({
            subject: name,
            percentage: Math.round((subjectAttMap[name].present / subjectAttMap[name].total) * 100),
            present: subjectAttMap[name].present,
            total: subjectAttMap[name].total
        }));

        // 3. Academic Marks & Trends
        const [marksRows] = await db.execute(`
            SELECT s.name AS subject_name, m.exam_type, m.score, m.total
            FROM Marks m
            JOIN Subjects s ON m.subject_id = s.subject_id
            WHERE m.prn = ?
            ORDER BY m.mark_id ASC
        `, [prn]);

        let academicScore = 75;
        let marksTrend = 'STABLE';
        let subjectMarks = [];

        if (marksRows.length > 0) {
            const totalScore = marksRows.reduce((acc, m) => acc + Number(m.score), 0);
            const totalPossible = marksRows.reduce((acc, m) => acc + Number(m.total), 0);
            academicScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 75;

            // Group by subject
            const subMap = {};
            marksRows.forEach(m => {
                if (!subMap[m.subject_name]) subMap[m.subject_name] = { score: 0, total: 0, items: [] };
                subMap[m.subject_name].score += Number(m.score);
                subMap[m.subject_name].total += Number(m.total);
                subMap[m.subject_name].items.push({ type: m.exam_type, score: m.score, total: m.total });
            });

            subjectMarks = Object.keys(subMap).map(k => ({
                subject: k,
                percentage: Math.round((subMap[k].score / subMap[k].total) * 100),
                score: subMap[k].score,
                total: subMap[k].total,
                items: subMap[k].items
            }));

            // Trend analysis: compare first half to second half
            if (marksRows.length >= 2) {
                const firstScore = Number(marksRows[0].score) / Number(marksRows[0].total);
                const lastScore = Number(marksRows[marksRows.length - 1].score) / Number(marksRows[marksRows.length - 1].total);
                if (lastScore > firstScore + 0.05) marksTrend = 'IMPROVING';
                else if (lastScore < firstScore - 0.05) marksTrend = 'DECLINING';
            }
        }

        // 4. Study Tasks & Consistency
        const [studyPlans] = await db.execute(`
            SELECT plan_id, subject_name, topic, target_date, status, priority, estimated_hours, xp_reward
            FROM Study_Plans
            WHERE prn = ?
            ORDER BY target_date ASC
        `, [prn]);

        const todayStr = new Date().toISOString().split('T')[0];
        const completedTasks = studyPlans.filter(t => t.status === 'COMPLETED');
        const overdueTasks = studyPlans.filter(t => t.status !== 'COMPLETED' && t.target_date < todayStr);
        const activeTasks = studyPlans.filter(t => t.status !== 'COMPLETED');

        // Study Consistency Score: on-time completion ratio adjusted for overdue items
        let studyConsistencyScore = 70;
        if (studyPlans.length > 0) {
            const completionRatio = completedTasks.length / studyPlans.length;
            const overduePenalty = overdueTasks.length * 15;
            studyConsistencyScore = Math.max(20, Math.min(98, Math.round(completionRatio * 100 - overduePenalty + 15)));
        }

        // 5. Gamification & Engagement
        const [gamificationRows] = await db.execute(`
            SELECT xp_points, streak_days, level, badges_json
            FROM Gamification
            WHERE prn = ?
        `, [prn]);

        const gamification = gamificationRows[0] || { xp_points: 150, streak_days: 2, level: 1, badges_json: '[]' };
        const parsedBadges = JSON.parse(gamification.badges_json || '[]');

        // Engagement Score: Composite of XP level, active streak, and study tasks
        const engagementScore = Math.min(98, Math.max(30, Math.round(
            (gamification.level * 15) + 
            Math.min(30, gamification.streak_days * 5) + 
            (completedTasks.length * 8) + 20
        )));

        // 6. Career Readiness
        const [careerRows] = await db.execute(`
            SELECT target_role, skills_acquired, skills_missing, match_percentage, roadmap_json
            FROM Career_Profiles
            WHERE prn = ?
        `, [prn]);

        const careerProfile = careerRows[0] ? {
            targetRole: careerRows[0].target_role,
            skillsAcquired: careerRows[0].skills_acquired?.split(',').map(s => s.trim()) || [],
            skillsMissing: careerRows[0].skills_missing?.split(',').map(s => s.trim()) || [],
            matchPercentage: careerRows[0].match_percentage || 50,
            roadmap: JSON.parse(careerRows[0].roadmap_json || '[]')
        } : {
            targetRole: 'Software Engineer',
            skillsAcquired: ['Python', 'SQL'],
            skillsMissing: ['Cloud Architecture', 'CI/CD'],
            matchPercentage: 55,
            roadmap: []
        };

        const careerReadinessScore = careerProfile.matchPercentage;

        // 7. Wellness & Stress Signals (Non-Medical)
        const [wellnessRows] = await db.execute(`
            SELECT mood, created_at FROM Faculty_Alerts WHERE prn = ? ORDER BY created_at DESC LIMIT 5
        `, [prn]);

        const recentStressChecks = wellnessRows.filter(w => w.mood === 'Stressed' || w.mood === 'Sad').length;
        const recentHappyChecks = wellnessRows.filter(w => w.mood === 'Happy' || w.mood === 'Focused').length;

        let wellnessSignal = 'Stable';
        if (recentStressChecks >= 2) wellnessSignal = 'Elevated Stress Signal';
        else if (recentHappyChecks >= 2) wellnessSignal = 'Optimal Focus';
        else if (wellnessRows.length === 0) wellnessSignal = 'Normal Benchmark';

        // 8. Active HyperIntervene Interventions
        const [interventionsRows] = await db.execute(`
            SELECT intervention_id, title, description, reason, priority, status, due_date, action_type, timeline_json
            FROM Interventions
            WHERE student_prn = ?
            ORDER BY created_at DESC
        `, [prn]);

        const activeInterventions = interventionsRows.filter(i => i.status !== 'COMPLETED').map(i => ({
            ...i,
            timeline: JSON.parse(i.timeline_json || '[]')
        }));

        // 9. Derive Strengths & Areas of Attention
        const strengths = [];
        const attentionAreas = [];

        // Evaluate Strengths
        if (attendanceScore >= 85) strengths.push({ title: 'Strong Attendance Discipline', detail: `Maintained ${attendanceScore}% attendance across classroom and lab sessions.` });
        if (academicScore >= 75) strengths.push({ title: 'Solid Coursework Foundation', detail: `Averaging ${academicScore}% across formal evaluations.` });
        if (gamification.streak_days >= 3) strengths.push({ title: 'Active Learning Streak', detail: `${gamification.streak_days}-day consecutive activity streak recorded in study planner.` });
        if (careerProfile.skillsAcquired.length >= 3) strengths.push({ title: 'Validated Technical Skills', detail: `Acquired key core competencies: ${careerProfile.skillsAcquired.slice(0, 3).join(', ')}.` });
        if (completedTasks.length >= 2) strengths.push({ title: 'Milestone Execution', detail: `Completed ${completedTasks.length} dedicated self-study milestones.` });
        if (strengths.length === 0) strengths.push({ title: 'Regular Course Registration', detail: 'Actively enrolled and engaged in core semester curriculum.' });

        // Evaluate Attention Areas
        if (attendanceScore < 75) attentionAreas.push({ area: 'Classroom Presence', severity: 'HIGH', detail: `Attendance is at ${attendanceScore}% (below 75% university eligibility requirement).` });
        if (overdueTasks.length > 0) attentionAreas.push({ area: 'Study Plan Consistency', severity: 'HIGH', detail: `${overdueTasks.length} study tasks are past due date.` });
        if (subjectMarks.some(s => s.percentage < 60)) {
            const lowest = subjectMarks.reduce((min, s) => s.percentage < min.percentage ? s : min, subjectMarks[0]);
            attentionAreas.push({ area: 'Course Evaluation Score', severity: 'MEDIUM', detail: `${lowest.subject} current average is ${lowest.percentage}%.` });
        }
        if (wellnessSignal === 'Elevated Stress Signal') attentionAreas.push({ area: 'Wellness Signal', severity: 'MEDIUM', detail: 'Recent focus and stress check-ins indicate elevated study fatigue.' });
        if (attentionAreas.length === 0) attentionAreas.push({ area: 'Routine Optimization', severity: 'LOW', detail: 'Maintain current cadence and review upcoming assessment targets.' });

        // 10. AI Holistic Insight & Primary Issue Determination (Hybrid Layer)
        let primaryIssue = 'Study Consistency & Task Prioritization';
        let primaryWhy = 'Multiple study milestones require focused completion prior to upcoming assessments.';
        let aiRecommendations = [
            `Prioritize overdue review modules in your AI Study Planner.`,
            `Review core concepts in ${subjectMarks[0]?.subject || 'key technical subjects'}.`,
            `Engage with EduERP Guide counselor for personalized revision strategies.`
        ];

        // Deterministic heuristic logic
        if (overdueTasks.length >= 2) {
            primaryIssue = 'Inconsistent Study Milestone Execution';
            primaryWhy = `${overdueTasks.length} scheduled study tasks are overdue, impacting overall consistency (${studyConsistencyScore}/100).`;
        } else if (attendanceScore < 75) {
            primaryIssue = 'Classroom Attendance Deficit';
            primaryWhy = `Attendance has dropped to ${attendanceScore}%, placing semester course credit eligibility at risk.`;
        } else if (subjectMarks.some(s => s.percentage < 55)) {
            const low = subjectMarks.find(s => s.percentage < 55);
            primaryIssue = `Academic Friction in ${low.subject}`;
            primaryWhy = `Evaluation scores in ${low.subject} (${low.percentage}%) are below departmental benchmark.`;
        }

        // Try Gemini 1.5 Flash Enhancement (2.5s timeout)
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompt = `
                  Analyze verified student ERP facts:
                  Student: ${student.first_name} ${student.last_name} (${prn})
                  Academic Score: ${academicScore}/100 (Trend: ${marksTrend})
                  Attendance: ${attendanceScore}%
                  Engagement Score: ${engagementScore}/100
                  Study Consistency: ${studyConsistencyScore}/100 (Overdue Tasks: ${overdueTasks.length})
                  Career Readiness: ${careerReadinessScore}/100 (Target: ${careerProfile.targetRole})
                  Wellness Signal: ${wellnessSignal}

                  Return ONLY raw JSON without code fences:
                  {
                    "primaryIssue": "<Short 3-5 word Title of primary academic friction>",
                    "primaryWhy": "<1-2 sentence evidence explanation based strictly on provided facts>",
                    "recommendations": ["<Action 1>", "<Action 2>", "<Action 3>"]
                  }
                `;

                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 2500));
                const aiResult = await Promise.race([model.generateContent(prompt), timeoutPromise]);
                let jsonText = aiResult.response.text().trim();
                if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7);
                if (jsonText.endsWith('```')) jsonText = jsonText.substring(0, jsonText.length - 3);
                const parsed = JSON.parse(jsonText);
                if (parsed.primaryIssue && parsed.recommendations) {
                    primaryIssue = parsed.primaryIssue;
                    primaryWhy = parsed.primaryWhy || primaryWhy;
                    aiRecommendations = parsed.recommendations;
                }
            } catch (aiErr) {
                // Heuristic fallback already in place
            }
        }

        // 11. Trend Data for Visual Charts
        const trends = {
            academic: subjectMarks.map(s => ({ name: s.subject.substring(0, 14), score: s.percentage })),
            attendanceHistory: subjectAttendance.map(s => ({ name: s.subject.substring(0, 14), attendance: s.percentage })),
            studyProgress: [
                { status: 'Completed', count: completedTasks.length },
                { status: 'Overdue', count: overdueTasks.length },
                { status: 'In Progress', count: activeTasks.length - overdueTasks.length }
            ]
        };

        res.json({
            student,
            scores: {
                academic: academicScore,
                attendance: attendanceScore,
                engagement: engagementScore,
                studyConsistency: studyConsistencyScore,
                careerReadiness: careerReadinessScore,
                wellnessSignal
            },
            academic: {
                score: academicScore,
                trend: marksTrend,
                subjects: subjectMarks
            },
            attendance: {
                score: attendanceScore,
                totalClasses,
                presentClasses,
                subjects: subjectAttendance
            },
            engagement: {
                score: engagementScore,
                xp: gamification.xp_points,
                streak: gamification.streak_days,
                level: gamification.level,
                badges: parsedBadges
            },
            study: {
                consistencyScore: studyConsistencyScore,
                completedCount: completedTasks.length,
                overdueCount: overdueTasks.length,
                activeCount: activeTasks.length,
                tasks: studyPlans
            },
            career: careerProfile,
            wellness: {
                signal: wellnessSignal,
                recentChecks: wellnessRows
            },
            interventions: {
                active: activeInterventions,
                count: activeInterventions.length
            },
            aiInsight: {
                primaryIssue,
                primaryWhy,
                recommendations: aiRecommendations
            },
            strengths,
            attentionAreas,
            trends
        });

    } catch (err) {
        console.error('Error fetching Student 360 profile:', err);
        res.status(500).json({ error: 'Failed to aggregate Student 360 intelligence profile.' });
    }
});

module.exports = router;
