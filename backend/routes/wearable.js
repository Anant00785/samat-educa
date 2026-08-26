const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/wearable/live/:prn — Fetch biometric telemetry stream
router.get('/live/:prn', authenticateToken, async (req, res) => {
    const { prn } = req.params;
    try {
        const [records] = await db.execute(`
            SELECT telemetry_id, prn, heart_rate, hrv, stress_index, sleep_hours, steps, status_label, device_source, recorded_at
            FROM Wearable_Telemetry
            WHERE prn = ?
            ORDER BY recorded_at DESC
            LIMIT 15
        `, [prn]);

        const latest = records[0] || {
            heart_rate: 74,
            hrv: 62,
            stress_index: 28,
            sleep_hours: 7.5,
            steps: 8200,
            status_label: 'Optimal Recovery',
            device_source: 'Simulated Wearable BioSensor v2.1'
        };

        res.json({
            isDemoMode: true,
            deviceConnected: true,
            providerSpec: {
                supportedProviders: ['Fitbit Web API v1.2', 'Garmin Health REST API', 'Apple HealthKit Sync', 'Mock BioSensor Stream'],
                activeProvider: 'HyperCampus BioSensor Simulator (Ready for OAuth 2.0 Integration)'
            },
            currentTelemetry: latest,
            history: records.reverse() // chronological for charts
        });
    } catch (err) {
        console.error('Error fetching wearable telemetry:', err);
        res.status(500).json({ error: 'Failed to fetch wearable telemetry' });
    }
});

// POST /api/wearable/simulate-reading — Generate new biometric reading in demo stream
router.post('/simulate-reading', authenticateToken, async (req, res) => {
    const { prn, mode } = req.body;
    try {
        let hr = 72 + Math.floor(Math.random() * 12);
        let hrv = 60 + Math.floor(Math.random() * 15);
        let stress = 25 + Math.floor(Math.random() * 20);
        let sleep = 7.4;
        let steps = 7500 + Math.floor(Math.random() * 2000);
        let label = 'Balanced Autonomic State';

        if (mode === 'EXAM_STRESS') {
            hr = 98 + Math.floor(Math.random() * 15);
            hrv = 34 + Math.floor(Math.random() * 10);
            stress = 78 + Math.floor(Math.random() * 15);
            label = 'Elevated Sympathetic Arousal (Exam Stress)';
        } else if (mode === 'DEEP_REST') {
            hr = 64 + Math.floor(Math.random() * 6);
            hrv = 78 + Math.floor(Math.random() * 10);
            stress = 14 + Math.floor(Math.random() * 8);
            label = 'Deep Parasympathetic Recovery';
        }

        const [result] = await db.execute(`
            INSERT INTO Wearable_Telemetry (prn, heart_rate, hrv, stress_index, sleep_hours, steps, status_label)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [prn || 'PRN000', hr, hrv, stress, sleep, steps, label]);

        // If stress is high, log a wellness alert
        if (stress > 70) {
            await db.execute(`
                INSERT INTO Alerts (target_role, student_prn, title, message, severity, type, is_read)
                VALUES ('STUDENT', ?, 'Bio-Feedback Alert: High Stress Indicator', 'Your wearable bio-sensor detected sustained elevated heart rate & low HRV. Consider taking a 5-minute breathing break.', 'WARNING', 'WELLNESS', 0)
            `, [prn || 'PRN000']);
        }

        res.json({
            success: true,
            telemetry: { telemetry_id: result.insertId, prn, heart_rate: hr, hrv, stress_index: stress, sleep_hours: sleep, steps, status_label: label }
        });
    } catch (err) {
        console.error('Error simulating telemetry:', err);
        res.status(500).json({ error: 'Failed to simulate reading' });
    }
});

module.exports = router;
