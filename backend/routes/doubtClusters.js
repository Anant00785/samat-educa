const express = require('express');
const router = express.Router();
const https = require('https');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

// Realistic high-yield academic semantic doubt clusters
const MOCK_DOUBT_CLUSTERS = [
    {
        id: 'cluster-cs-rec',
        subject: 'Data Structures & Algorithms',
        department: 'Computer Science',
        clusterName: 'Recursion Base Cases & Call Stack Overflow',
        severity: 'CRITICAL',
        studentCount: 46,
        queryVolume: 128,
        percentageImpact: 64,
        sampleQueries: [
            "Why is my recursive function giving maximum call stack size exceeded?",
            "How to write base condition for tree depth traversal without infinite loop?",
            "What happens to local variables when recursion unwinds?"
        ],
        detectedMisconception: "Students are forgetting to ensure parameters progress strictly toward the base case in helper recursion.",
        recommendedRemedialAction: "Spend 20 mins tracing call-stack memory frames on the whiteboard with small N=3 examples."
    },
    {
        id: 'cluster-phy-optics',
        subject: 'Engineering Physics',
        department: 'First Year Engineering',
        clusterName: 'Snell Law Normal vs Surface Angles & Total Internal Reflection',
        severity: 'CRITICAL',
        studentCount: 38,
        queryVolume: 94,
        percentageImpact: 52,
        sampleQueries: [
            "Do we calculate incidence angle from the glass surface or the perpendicular normal?",
            "When does light refract vs undergo total internal reflection at critical angle?",
            "Why does wavelength decrease but frequency remain constant in glass?"
        ],
        detectedMisconception: "Students frequently measure angle theta from horizontal interface rather than the normal vector.",
        recommendedRemedialAction: "Demonstrate ray tracing with oPhysics 3D simulator interface in the upcoming lecture."
    },
    {
        id: 'cluster-os-deadlock',
        subject: 'Operating Systems',
        department: 'Computer Science',
        clusterName: 'Deadlock Detection vs Prevention & Banker Algorithm',
        severity: 'MODERATE',
        studentCount: 29,
        queryVolume: 71,
        percentageImpact: 40,
        sampleQueries: [
            "How is safe state different from deadlock state in Banker algorithm?",
            "Can circular wait happen without hold-and-wait condition?",
            "Resource allocation graph cycle condition for single vs multi-instance."
        ],
        detectedMisconception: "Assuming a cycle in resource allocation graph always guarantees deadlock even in multi-instance resources.",
        recommendedRemedialAction: "Assign a 3-matrix matrix allocation tracing drill in tutorial class."
    },
    {
        id: 'cluster-chem-thermo',
        subject: 'Engineering Chemistry',
        department: 'First Year Engineering',
        clusterName: 'Gibbs Free Energy & Spontaneity Temperature Dependency',
        severity: 'LOW',
        studentCount: 14,
        queryVolume: 32,
        percentageImpact: 19,
        sampleQueries: [
            "Why is delta G negative for spontaneous reaction when delta S is negative?",
            "How to find crossover temperature where reaction shifts from non-spontaneous to spontaneous?"
        ],
        detectedMisconception: "Confusing enthalpy-driven spontaneity with entropy-driven spontaneity at high Kelvin temperatures.",
        recommendedRemedialAction: "Share a 1-page summary chart of the 4 delta H / delta S quadrants."
    }
];

// GET /api/doubt-clusters/summary
router.get('/summary', authenticateToken, (req, res) => {
    const totalDoubtQueries = MOCK_DOUBT_CLUSTERS.reduce((sum, c) => sum + c.queryVolume, 0);
    const affectedStudents = 82; // unique across batch

    res.json({
        success: true,
        stats: {
            totalDoubtQueries,
            affectedStudents,
            criticalClusters: MOCK_DOUBT_CLUSTERS.filter(c => c.severity === 'CRITICAL').length,
            batchHealthScore: 78
        },
        clusters: MOCK_DOUBT_CLUSTERS
    });
});

// POST /api/doubt-clusters/remedial-plan
router.post('/remedial-plan', authenticateToken, async (req, res) => {
    const { clusterId } = req.body;
    const cluster = MOCK_DOUBT_CLUSTERS.find(c => c.id === clusterId) || MOCK_DOUBT_CLUSTERS[0];

    const plan = {
        clusterId: cluster.id,
        clusterName: cluster.clusterName,
        subject: cluster.subject,
        revisionPoints: [
            `Re-clarify core definition: ${cluster.detectedMisconception}`,
            "Present a 2-step visual counter-example highlighting the common pitfall.",
            "Conduct a 5-minute live poll with 2 diagnostic questions."
        ],
        diagnosticQuestions: [
            {
                q: `What is the primary indicator that causes errors in ${cluster.clusterName}?`,
                ans: cluster.detectedMisconception
            },
            {
                q: `What is the optimal verification check before submitting a solution on this topic?`,
                ans: "Boundary condition check and tracing the base invariant."
            }
        ],
        remedialHandoutUrl: `/student/learning-hub?subject=${encodeURIComponent(cluster.subject)}`
    };

    res.json({ success: true, plan });
});

module.exports = router;
