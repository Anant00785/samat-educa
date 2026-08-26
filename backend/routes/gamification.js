const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/gamification/profile/:prn — Student profile gamification stats
router.get('/profile/:prn', authenticateToken, async (req, res) => {
    const { prn } = req.params;
    try {
        const [rows] = await db.execute('SELECT * FROM Gamification WHERE prn = ?', [prn]);

        const defaultBadges = [
            { id: 'badge_att_90', name: 'Attendance Star', icon: '🌟', desc: 'Maintained >90% attendance', unlocked: true },
            { id: 'badge_quiz_master', name: 'Quiz Master', icon: '🏆', desc: 'Scored 90%+ in 3 assessments', unlocked: true },
            { id: 'badge_streak_7', name: '7-Day Focus Streak', icon: '🔥', desc: 'Completed daily study plan 7 days in a row', unlocked: false },
            { id: 'badge_proctor_hero', name: 'Honor Code Champion', icon: '🛡️', desc: 'Completed 5 proctored exams with 0 violations', unlocked: true },
            { id: 'badge_ai_explorer', name: 'AI Explorer', icon: '🤖', desc: 'Consulted EduERP Guide 10 times', unlocked: true }
        ];

        if (rows.length > 0) {
            const g = rows[0];
            let userBadges = defaultBadges;
            try {
                const stored = JSON.parse(g.badges_json || '[]');
                if (stored.length > 0) userBadges = stored;
            } catch (e) {}

            const level = Math.floor(g.xp_points / 250) + 1;
            const nextLevelXp = level * 250;
            const currentLevelProgress = g.xp_points % 250;

            return res.json({
                prn: g.prn,
                xpPoints: g.xp_points,
                streakDays: g.streak_days,
                level,
                currentLevelProgress,
                nextLevelXp: 250,
                badges: userBadges,
                rankTitle: level > 3 ? 'Campus Scholar Elite' : level > 1 ? 'Academic Achiever' : 'Apprentice Learner'
            });
        }

        // Default record if not found
        res.json({
            prn,
            xpPoints: 350,
            streakDays: 4,
            level: 2,
            currentLevelProgress: 100,
            nextLevelXp: 250,
            badges: defaultBadges,
            rankTitle: 'Academic Achiever'
        });
    } catch (err) {
        console.error('Error fetching gamification stats:', err);
        res.status(500).json({ error: 'Failed to fetch gamification profile' });
    }
});

// GET /api/gamification/leaderboard — Global Academic Leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT g.prn, g.xp_points, g.streak_days, g.level, s.first_name, s.last_name, d.name as department
            FROM Gamification g
            JOIN Students s ON g.prn = s.prn
            JOIN Departments d ON s.dept_id = d.dept_id
            ORDER BY g.xp_points DESC, g.streak_days DESC
            LIMIT 10
        `);

        const formatted = rows.map((r, index) => ({
            rank: index + 1,
            prn: r.prn,
            name: `${r.first_name} ${r.last_name}`,
            department: r.department,
            xpPoints: r.xp_points,
            streakDays: r.streak_days,
            level: Math.floor(r.xp_points / 250) + 1,
            badgeIcon: index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// POST /api/gamification/award-xp — Award custom XP for learning milestones
router.post('/award-xp', authenticateToken, async (req, res) => {
    const { prn, xp, reason } = req.body;
    try {
        const addXp = Number(xp) || 50;
        await db.execute(`
            UPDATE Gamification
            SET xp_points = xp_points + ?, updated_at = CURRENT_TIMESTAMP
            WHERE prn = ?
        `, [addXp, prn]);

        res.json({ success: true, message: `+${addXp} XP awarded for: ${reason || 'Academic Activity'}` });
    } catch (err) {
        console.error('Error awarding XP:', err);
        res.status(500).json({ error: 'Failed to award XP' });
    }
});

module.exports = router;
