const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Comprehensive local skill templates for instant deterministic fallback
const ROLE_TEMPLATES = {
    'AI / Machine Learning Engineer': {
        required: ['Python', 'Linear Algebra', 'PyTorch / TensorFlow', 'Data Structures', 'Model Deployment (Docker/FastAPI)', 'MLOps'],
        projects: ['Real-time Emotion Classification WebApp', 'RAG Question-Answering Bot on Course Notes', 'Transformer-based Predictive Maintenance'],
        certifications: ['DeepLearning.AI Specialization', 'AWS Certified Machine Learning - Specialty']
    },
    'Full-Stack Cloud Developer': {
        required: ['React.js / Next.js', 'Node.js / Express', 'PostgreSQL / MongoDB', 'REST & GraphQL APIs', 'Docker & Kubernetes', 'CI/CD Pipelines'],
        projects: ['Multi-Tenant Campus Management System', 'Microservices E-Commerce API with Kafka', 'Real-time Collaborative Whiteboard'],
        certifications: ['AWS Certified Solutions Architect Associate', 'Meta Full-Stack Engineer Certificate']
    },
    'Cybersecurity & Network Analyst': {
        required: ['Network Protocols (TCP/IP, DNS)', 'Linux Administration', 'Penetration Testing (Metasploit, Wireshark)', 'Cryptography', 'SIEM & SOC Operations'],
        projects: ['Automated Vulnerability Scanner Script', 'Zero-Trust Campus Authentication Proxy', 'Intrusion Detection Honeypot'],
        certifications: ['CompTIA Security+', 'Certified Ethical Hacker (CEH)']
    },
    'Data Scientist & Analytics Lead': {
        required: ['SQL & Data Warehousing', 'Python / R', 'Statistical Modeling & Hypothesis Testing', 'Pandas & NumPy', 'Tableau / PowerBI', 'BigQuery'],
        projects: ['Student Dropout Risk Prediction Model', 'Retail Sales Forecasting Dashboard', 'Sentiment Analysis Pipeline on Social Data'],
        certifications: ['Google Advanced Data Analytics Professional', 'IBM Data Science Specialization']
    }
};

// GET /api/career/profile/:prn
router.get('/profile/:prn', authenticateToken, async (req, res) => {
    try {
        const { prn } = req.params;
        const [rows] = await db.execute('SELECT * FROM Career_Profiles WHERE prn = ?', [prn]);

        if (rows.length > 0) {
            const profile = rows[0];
            return res.json({
                targetRole: profile.target_role,
                skillsAcquired: profile.skills_acquired?.split(',').map(s => s.trim()) || [],
                skillsMissing: profile.skills_missing?.split(',').map(s => s.trim()) || [],
                matchPercentage: profile.match_percentage,
                roadmap: JSON.parse(profile.roadmap_json || '[]')
            });
        }

        // Default initial profile
        const defaultRole = 'AI / Machine Learning Engineer';
        const tpl = ROLE_TEMPLATES[defaultRole];
        res.json({
            targetRole: defaultRole,
            skillsAcquired: ['Python', 'SQL', 'Basic Data Structures'],
            skillsMissing: ['PyTorch / TensorFlow', 'Docker', 'MLOps'],
            matchPercentage: 65,
            roadmap: [
                { step: 1, title: 'Master Advanced Algorithms & Dynamic Programming', status: 'COMPLETED' },
                { step: 2, title: 'Build Neural Networks with PyTorch', status: 'IN_PROGRESS' },
                { step: 3, title: 'Containerize Models with Docker & FastAPI', status: 'PENDING' },
                { step: 4, title: 'Deploy on Cloud with CI/CD', status: 'PENDING' }
            ]
        });
    } catch (err) {
        console.error('Error fetching career profile:', err);
        res.status(500).json({ error: 'Failed to fetch career profile' });
    }
});

// POST /api/career/analyze
router.post('/analyze', authenticateToken, async (req, res) => {
    const { prn, targetRole, currentSkills } = req.body;
    try {
        const userSkills = Array.isArray(currentSkills) 
            ? currentSkills 
            : (currentSkills || 'Python, C++, SQL').split(',').map(s => s.trim()).filter(Boolean);
            
        const roleKey = Object.keys(ROLE_TEMPLATES).find(k => k.toLowerCase().includes(targetRole?.toLowerCase())) || 'AI / Machine Learning Engineer';
        const template = ROLE_TEMPLATES[roleKey] || ROLE_TEMPLATES['AI / Machine Learning Engineer'];

        // Compute instant deterministic gap analysis first
        const missing = template.required.filter(r => !userSkills.some(s => s.toLowerCase() === r.toLowerCase() || r.toLowerCase().includes(s.toLowerCase())));
        const acquired = userSkills;
        const matchScore = Math.min(95, Math.max(35, Math.round(((template.required.length - missing.length) / template.required.length) * 100)));
        
        let analysis = {
            targetRole: targetRole || roleKey,
            matchPercentage: matchScore,
            skillsAcquired: acquired,
            skillsMissing: missing.length > 0 ? missing : ['Advanced System Design', 'Cloud Scalability'],
            recommendedProjects: template.projects,
            recommendedCertifications: template.certifications,
            roadmap: [
                { step: 1, title: `Strengthen core foundations in ${missing[0] || 'Core Domain'}`, status: 'IN_PROGRESS' },
                { step: 2, title: `Build Capstone Project: ${template.projects[0]}`, status: 'PENDING' },
                { step: 3, title: `Master ${missing[1] || 'Hands-on Tools & Frameworks'}`, status: 'PENDING' },
                { step: 4, title: `Achieve Industry Certification: ${template.certifications[0]}`, status: 'PENDING' }
            ]
        };

        // Try Groq LLM enhancement first, fallback to Gemini
        const groqPrompt = `Analyze student career path. Target Role: "${targetRole || roleKey}", Current Skills: "${userSkills.join(', ')}". Return valid raw JSON only without markdown: {"matchPercentage": ${matchScore}, "skillsAcquired": ${JSON.stringify(acquired)}, "skillsMissing": ${JSON.stringify(missing)}, "roadmap": [{"step": 1, "title": "Milestone 1", "status": "IN_PROGRESS"}, {"step": 2, "title": "Milestone 2", "status": "PENDING"}, {"step": 3, "title": "Milestone 3", "status": "PENDING"}, {"step": 4, "title": "Milestone 4", "status": "PENDING"}]}`;
        
        if (process.env.GROQ_API_KEY) {
            try {
                const https = require('https');
                const gRes = await new Promise((resolve) => {
                    const reqBody = JSON.stringify({
                        model: 'qwen/qwen3.8-27b',
                        messages: [
                            { role: 'system', content: 'You are an expert career guidance AI. Return valid raw JSON only.' },
                            { role: 'user', content: groqPrompt }
                        ],
                        max_tokens: 350,
                        temperature: 0.5
                    });
                    const req = https.request({
                        hostname: 'api.groq.com',
                        port: 443,
                        path: '/openai/v1/chat/completions',
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(reqBody)
                        },
                        timeout: 3000
                    }, res => {
                        let d = '';
                        res.on('data', c => d += c);
                        res.on('end', () => {
                            try {
                                const j = JSON.parse(d);
                                resolve(j.choices?.[0]?.message?.content);
                            } catch { resolve(null); }
                        });
                    });
                    req.on('error', () => resolve(null));
                    req.on('timeout', () => { req.destroy(); resolve(null); });
                    req.write(reqBody);
                    req.end();
                });

                if (gRes) {
                    let cleaned = gRes.trim();
                    if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
                    if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
                    const parsed = JSON.parse(cleaned);
                    if (parsed.roadmap && parsed.matchPercentage) {
                        analysis = { ...analysis, ...parsed, targetRole: targetRole || roleKey };
                    }
                }
            } catch (gErr) {
                console.log("Groq career fallback:", gErr.message);
            }
        }

        // Save or update in database
        if (prn) {
            const [existing] = await db.execute('SELECT profile_id FROM Career_Profiles WHERE prn = ?', [prn]);
            if (existing.length > 0) {
                await db.execute(`
                    UPDATE Career_Profiles 
                    SET target_role = ?, skills_acquired = ?, skills_missing = ?, match_percentage = ?, roadmap_json = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE prn = ?
                `, [targetRole || roleKey, analysis.skillsAcquired.join(', '), analysis.skillsMissing.join(', '), analysis.matchPercentage, JSON.stringify(analysis.roadmap), prn]);
            } else {
                await db.execute(`
                    INSERT INTO Career_Profiles (prn, target_role, skills_acquired, skills_missing, match_percentage, roadmap_json)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [prn, targetRole || roleKey, analysis.skillsAcquired.join(', '), analysis.skillsMissing.join(', '), analysis.matchPercentage, JSON.stringify(analysis.roadmap)]);
            }
        }

        res.json({ success: true, analysis });
    } catch (err) {
        console.error('Error analyzing career path:', err);
        res.status(500).json({ error: 'Failed to analyze career path' });
    }
});

module.exports = router;
