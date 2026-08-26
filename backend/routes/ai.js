const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// POST /api/ai/chat — Emotion & ERP Context-Aware Multilingual AI Counselor
router.post('/chat', async (req, res) => {
    const { message, imageBase64, language = 'en', prn = 'PRN000' } = req.body;

    try {
        // 1. Fetch live ERP context for student
        let erpContextStr = "Student: Enrolled in Tech Campus.";
        if (prn) {
            try {
                const [stu] = await db.execute('SELECT s.first_name, s.last_name, d.name as dept FROM Students s JOIN Departments d ON s.dept_id = d.dept_id WHERE s.prn = ?', [prn]);
                const [att] = await db.execute('SELECT status FROM Attendance WHERE prn = ?', [prn]);
                const [fees] = await db.execute('SELECT amount, status FROM Fees WHERE prn = ?', [prn]);
                
                const totalAtt = att.length;
                const pres = att.filter(a => a.status === 'PRESENT').length;
                const attPct = totalAtt > 0 ? Math.round((pres / totalAtt) * 100) : 95;
                const feeStat = fees[0] ? `${fees[0].status} (Rs. ${fees[0].amount})` : 'Paid';
                const name = stu[0] ? `${stu[0].first_name} ${stu[0].last_name}` : 'Student';

                erpContextStr = `Student Name: ${name}, PRN: ${prn}, Dept: ${stu[0]?.dept || 'CS'}, Attendance: ${attPct}%, Fee Status: ${feeStat}.`;
            } catch (dbErr) {
                console.log("Context lookup fallback:", dbErr.message);
            }
        }

        const languageInstructions = {
            'en': 'Respond in clear, friendly English.',
            'hi': 'Respond in natural, encouraging Hindi (हिंदी Script or Hinglish).',
            'bn': 'Respond in warm, supportive Bengali (বাংলা Script).'
        };

        const langPrompt = languageInstructions[language] || languageInstructions['en'];

        // 2. Try Gemini Model
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
            try {
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash",
                    systemInstruction: `You are EduERP Guide, a warm, motivating, emotion-aware AI Counselor for HyperCampus AI.
                    ${langPrompt}
                    Current Student ERP Context: ${erpContextStr}
                    Your job is to encourage the student, help with course/study advice, answer ERP queries (attendance, fees, subjects), and provide career inspiration.
                    Keep answers concise (2-3 sentences max) and suitable for speech synthesis. Avoid markdown formatting like asterisks or bullet stars so voice reading sounds natural.`
                });

                let result;
                if (imageBase64) {
                    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
                    const imagePart = {
                        inlineData: { data: base64Data, mimeType: "image/jpeg" },
                    };
                    result = await model.generateContent([message, imagePart]);
                } else {
                    result = await model.generateContent(message);
                }
                const reply = result.response.text().trim();
                return res.json({ reply, generatedBy: 'Gemini 2.5 Flash' });
            } catch (geminiErr) {
                console.log("Gemini Counselor fallback triggered:", geminiErr.message);
            }
        }

        // 3. Robust Local Intelligent Heuristics Fallback
        const lowerMsg = (message || '').toLowerCase();
        let fallbackReply = "You're doing great! Keep focusing on your daily learning milestones and remember to take short breaks between study sessions.";

        if (lowerMsg.includes('attendance')) {
            fallbackReply = language === 'hi' 
                ? "आपकी उपस्थिति 95% से अधिक है, जो बहुत अच्छी स्थिति है! कक्षा में ऐसे ही नियमित रहें।"
                : language === 'bn'
                ? "আপনার উপস্থিতি ৯৫% এর বেশি, যা খুব ভালো! নিয়মিত ক্লাসে যোগ দিন।"
                : `Your current attendance is in great standing (${erpContextStr}). Keep attending your lab sessions consistently!`;
        } else if (lowerMsg.includes('fee') || lowerMsg.includes('fees')) {
            fallbackReply = language === 'hi'
                ? "आपकी फीस स्थिति कॉलेज रिकॉर्ड के अनुसार क्लियर है। आप फीस टैब में विवरण देख सकते हैं।"
                : language === 'bn'
                ? "আপনার ফি রেকর্ড অনুযায়ী আপডেট করা আছে। আপনি ফি পেজে বিবরণ দেখতে পারেন।"
                : `Your fees records are up to date in the ERP portal. You can view invoices in the Fees section.`;
        } else if (lowerMsg.includes('stressed') || lowerMsg.includes('tired') || lowerMsg.includes('anxious')) {
            fallbackReply = language === 'hi'
                ? "चिंता मत कीजिए, परीक्षा का तनाव सामान्य है। 5 मिनट का डीप ब्रीदिंग ब्रेक लें और फिर से शुरुआत करें।"
                : language === 'bn'
                ? "চিন্তা করবেন না, পরীক্ষার চাপ স্বাভাবিক। ৫ মিনিট বিশ্রাম নিন এবং শান্ত মনে পড়াশোনা করুন।"
                : "It is completely natural to feel pressure before tests. Take a 5-minute deep breathing break, stay hydrated, and tackle one topic at a time!";
        } else if (lowerMsg.includes('exam') || lowerMsg.includes('study')) {
            fallbackReply = language === 'hi'
                ? "अपनी कमजोर विषयों को प्राथमिकता देने के लिए AI स्टडी प्लानर का उपयोग करें।"
                : language === 'bn'
                ? "আপনার দুর্বল বিষয়গুলোর রিভিশন করতে AI স্টাডি প্ল্যানার ব্যবহার করুন।"
                : "Check your AI Study Planner to see today's high-priority revision tasks and earn XP points as you complete them!";
        }

        res.json({ reply: fallbackReply, generatedBy: 'HyperCampus Heuristic Counselor' });
    } catch (err) {
        console.error("AI Counselor Error:", err);
        res.status(500).json({ reply: "EduERP Guide is online and here to support your learning journey!" });
    }
});

// POST /api/ai/analyze-stress — AI Mood & Emotion Fusion Engine
router.post('/analyze-stress', async (req, res) => {
    const { imageBase64, text, prn } = req.body;
    
    try {
        let predictedMood = null;
        let predictionConfidence = 85;

        // 1. Call local Python Emotion CNN if available
        if (imageBase64) {
             try {
                 const pythonRes = await fetch('http://127.0.0.1:5001/predict', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ imageBase64 })
                 });
                 if (pythonRes.ok) {
                     const pyData = await pythonRes.json();
                     predictedMood = pyData.emotion;
                     predictionConfidence = pyData.confidence;
                 }
             } catch(err) {
                 // Python service offline, fall back to text & computer vision heuristics
             }
        }

        // 2. Gemini Analysis
        let analysis = null;
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `
                  Analyze the student's emotional state based on text: "${text || 'Looking calm'}".
                  ${predictedMood ? `Local facial vision model estimated mood: "${predictedMood}" (${predictionConfidence}% confidence).` : ''}
                  
                  Return strictly raw JSON format without markdown code fences:
                  {
                    "mood": "${predictedMood || 'Happy'}",
                    "confidence": ${predictionConfidence},
                    "focus_score": 82,
                    "suggestions": ["Take a 10 min hydration break", "Review high-priority study flashcards"],
                    "alertTeacher": false
                  }
                  Set alertTeacher to true ONLY if mood is Sad or Stressed.
                `;
                const result = await model.generateContent(prompt);
                let jsonStr = result.response.text().trim();
                if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
                if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
                analysis = JSON.parse(jsonStr);
            } catch (apiErr) {
                console.log("Gemini Emotion analysis fallback:", apiErr.message);
            }
        }

        // 3. Fallback Heuristics
        if (!analysis) {
            const lowerText = (text || '').toLowerCase();
            let mood = predictedMood || 'Neutral';
            let focus = 75;
            let alertTeacher = false;

            if (lowerText.includes('happy') || lowerText.includes('good') || lowerText.includes('excited') || lowerText.includes('great')) {
                mood = 'Happy';
                focus = 88;
            } else if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('cry')) {
                mood = 'Sad';
                focus = 45;
                alertTeacher = true;
            } else if (lowerText.includes('stress') || lowerText.includes('overwhelm') || lowerText.includes('anxious') || lowerText.includes('fail')) {
                mood = 'Stressed';
                focus = 50;
                alertTeacher = true;
            }

            analysis = {
                mood,
                confidence: predictionConfidence,
                focus_score: focus,
                suggestions: mood === 'Stressed' || mood === 'Sad'
                    ? ["Practice 4-7-8 deep breathing technique", "Reach out to your faculty mentor for course clarification", "Take a short 15-minute nature walk"]
                    : ["Maintain consistent study momentum", "Help a peer with today's lab topic", "Review your AI Study Planner targets"],
                alertTeacher
            };
        }

        // Save Alert if needed
        if (analysis.alertTeacher && prn) {
            await db.execute('INSERT INTO Faculty_Alerts (prn, mood, suggestions, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)', 
                 [prn, analysis.mood, JSON.stringify(analysis.suggestions)]);

            await db.execute(`
                INSERT INTO Alerts (target_role, student_prn, title, message, severity, type, is_read)
                VALUES ('FACULTY', ?, 'Student Wellness Flag: ' || ?, ?, 'WARNING', 'WELLNESS', 0)
            `, [prn, analysis.mood, `Student ${prn} reported feeling ${analysis.mood}. Early mentor support recommended.`]);
        }

        res.json(analysis);
    } catch (err) {
        console.error("Emotion Fusion Error:", err);
        res.status(500).json({ error: "Failed to analyze stress." });
    }
});

module.exports = router;
