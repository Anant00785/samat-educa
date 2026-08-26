const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/cctv/zones — Campus CCTV zones analytics
router.get('/zones', authenticateToken, authorizeRoles('ADMIN', 'FACULTY'), async (req, res) => {
    try {
        const [zones] = await db.execute(`
            SELECT analytics_id, campus_id, camera_name, zone_location, occupancy_count, capacity, status, anomaly_detected, anomaly_description, recorded_at
            FROM CCTV_Analytics
            ORDER BY analytics_id ASC
        `);

        const totalOccupancy = zones.reduce((sum, z) => sum + z.occupancy_count, 0);
        const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
        const anomalyCount = zones.filter(z => z.anomaly_detected === 1).length;

        res.json({
            isDemoMode: true,
            streamSpec: {
                protocol: 'RTSP / WebRTC Stream Proxy (H.264 / OpenCV Background Subtraction)',
                hardwareSupport: ['Hikvision IP Cams', 'Dahua RTSP Feeds', 'Standard USB / IP Webcams', 'Sample Video Ingestion'],
                activeFeedType: 'Interactive Campus Video & Headcount Simulator'
            },
            summary: {
                totalCameras: zones.length,
                totalOccupancy,
                totalCapacity,
                overallOccupancyRate: Math.round((totalOccupancy / totalCapacity) * 100) + '%',
                activeAnomalies: anomalyCount
            },
            zones
        });
    } catch (err) {
        console.error('Error fetching CCTV analytics:', err);
        res.status(500).json({ error: 'Failed to fetch CCTV analytics' });
    }
});

// POST /api/cctv/trigger-anomaly — Simulate anomaly detection in zone
router.post('/trigger-anomaly', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { camera_name, description } = req.body;
    try {
        await db.execute(`
            UPDATE CCTV_Analytics
            SET anomaly_detected = 1, anomaly_description = ?, status = 'Alert Flagged'
            WHERE camera_name = ?
        `, [description || 'Overcrowding threshold exceeded in zone', camera_name]);

        // Dispatch high severity admin alert
        await db.execute(`
            INSERT INTO Alerts (target_role, title, message, severity, type, is_read)
            VALUES ('ADMIN', 'CCTV Security Alert: ' || ?, ?, 'HIGH', 'SECURITY', 0)
        `, [camera_name, description || 'Abnormal movement or occupancy spike detected.']);

        res.json({ success: true, message: `Anomaly registered on ${camera_name}` });
    } catch (err) {
        console.error('Error triggering CCTV anomaly:', err);
        res.status(500).json({ error: 'Failed to trigger anomaly' });
    }
});

// POST /api/cctv/resolve-anomaly
router.post('/resolve-anomaly', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
    const { camera_name } = req.body;
    try {
        await db.execute(`
            UPDATE CCTV_Analytics
            SET anomaly_detected = 0, anomaly_description = NULL, status = 'Normal'
            WHERE camera_name = ?
        `, [camera_name]);

        res.json({ success: true, message: `Anomaly cleared for ${camera_name}` });
    } catch (err) {
        console.error('Error resolving anomaly:', err);
        res.status(500).json({ error: 'Failed to resolve anomaly' });
    }
});

module.exports = router;
