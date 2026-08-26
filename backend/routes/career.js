const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Comprehensive local skill templates for deterministic fallback
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
        const userSkills = Array.isArray(currentSkills) ? currentSkills : (currentSkills || 'Python, C++, SQL').split(',').map(s => s.trim());
        const roleKey = Object.keys(ROLE_TEMPLATES).find(k => k.toLowerCase().includes(targetRole?.toLowerCase())) || 'AI / Machine Learning Engineer';
        const template = ROLE_TEMPLATES[roleKey] || ROLE_TEMPLATES['AI / Machine Learning Engineer'];

        // AI Generation with Gemini
        let analysis = null;
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `
                    You are an expert AI Career Mentor for university students.
                    Target Role: "${targetRole}"
                    Student's Current Skills: "${userSkills.join(', ')}"
                    
                    Perform a strict skill gap analysis and roadmap generation.
                    Return ONLY valid raw JSON adhering to this structure without markdown formatting or code fences:
                    {
                      "matchPercentage": <number between 30 and 95>,
                      "skillsAcquired": ["Skill 1", "Skill 2"],
                      "skillsMissing": ["Missing 1", "Missing 2"],
                      "recommendedProjects": ["Project 1", "Project 2", "Project 3"],
                      "recommendedCertifications": ["Cert 1", "Cert 2"],
                      "roadmap": [
                        { "step": 1, "title": "Milestone 1 description", "status": "IN_PROGRESS" },
                        { "step": 2, "title": "Milestone 2 description", "status": "PENDING" },
                        { "step": 3, "title": "Milestone 3 description", "status": "PENDING" },
                        { "step": 4, "title": "Milestone 4 description", "status": "PENDING" }
                      ]
                    }
                `;
                const result = await model.generateContent(prompt);
                let jsonText = result.response.text().trim();
                if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7);
                if (jsonText.endsWith('```')) jsonText = jsonText.substring(0, jsonText.length - 3);
                analysis = JSON.parse(jsonText);
            } catch (aiErr) {
                console.log("Gemini Career Analysis Fallback:", aiErr.message);
            }
        }

        // Local Fallback if Gemini fails or is not configured
        if (!analysis) {
            const missing = template.required.filter(r => !userSkills.some(s => s.toLowerCase() === r.toLowerCase()));
            const matchScore = Math.max(40, Math.round(((template.required.length - missing.length) / template.required.length) * 100));
            analysis = {
                matchPercentage: matchScore,
                skillsAcquired: userSkills,
                skillsMissing: missing,
                recommendedProjects: template.projects,
                recommendedCertifications: template.certifications,
                roadmap: [
                    { step: 1, title: `Strengthen core foundations in ${missing[0] || 'Core Subject'}`, status: 'IN_PROGRESS' },
                    { step: 2, title: `Build Capstone Project: ${template.projects[0]}`, status: 'PENDING' },
                    { step: 3, title: `Gain hands-on proficiency in ${missing[1] || 'Cloud Deployment'}`, status: 'PENDING' },
                    { step: 4, title: `Complete Certification: ${template.certifications[0]}`, status: 'PENDING' }
                ]
            };
        }

        // Save or update in database
        if (prn) {
            const [existing] = await db.execute('SELECT profile_id FROM Career_Profiles WHERE prn = ?', [prn]);
            if (existing.length > 0) {
                await db.execute(`
                    UPDATE Career_Profiles 
                    SET target_role = ?, skills_acquired = ?, skills_missing = ?, match_percentage = ?, roadmap_json = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE prn = ?
                `, [targetRole, analysis.skillsAcquired.join(', '), analysis.skillsMissing.join(', '), analysis.matchPercentage, JSON.stringify(analysis.roadmap), prn]);
            } else {
                await db.execute(`
                    INSERT INTO Career_Profiles (prn, target_role, skills_acquired, skills_missing, match_percentage, roadmap_json)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [prn, targetRole, analysis.skillsAcquired.join(', '), analysis.skillsMissing.join(', '), analysis.matchPercentage, JSON.stringify(analysis.roadmap)]);
            }
        }

        res.json({ success: true, analysis });
    } catch (err) {
        console.error('Error analyzing career path:', err);
        res.status(500).json({ error: 'Failed to analyze career path' });
    }
});

module.exports = router;
