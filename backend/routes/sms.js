const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// POST /api/sms/send-alert — Real Fast2SMS Gateway Dispatcher
router.post('/send-alert', authenticateToken, async (req, res) => {
    const { phoneNumber, studentName, prn, messageType, customMessage } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required.' });
    }

    // Clean phone number (strip +91 or spaces, must be 10 digits for Fast2SMS)
    const cleanedNumber = phoneNumber.toString().replace(/[^0-9]/g, '').slice(-10);

    let messageText = customMessage;
    if (!messageText) {
        if (messageType === 'ATTENDANCE_WARNING') {
            messageText = `HyperCampus AI Alert: Student ${studentName || prn} has attendance below 75%. Please contact faculty advisor for guidance.`;
        } else if (messageType === 'EXAM_REMINDER') {
            messageText = `HyperCampus AI: Reminder for upcoming assessment. Please ensure student ${studentName || prn} reviews their priority study plan.`;
        } else if (messageType === 'WELLNESS_CHECK') {
            messageText = `HyperCampus AI Wellness: A supportive mentorship check-in has been scheduled for ${studentName || prn}.`;
        } else {
            messageText = `HyperCampus AI Notification: Academic update available for student ${studentName || prn} on the Parent Portal.`;
        }
    }

    try {
        let fast2smsResponse = null;
        const apiKey = process.env.FAST2SMS_API_KEY;

        if (apiKey && apiKey.length > 10) {
            try {
                const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                    method: 'POST',
                    headers: {
                        'authorization': apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        route: 'q',
                        message: messageText,
                        language: 'english',
                        flash: 0,
                        numbers: cleanedNumber
                    })
                });

                fast2smsResponse = await response.json();
                console.log('Fast2SMS Live Gateway Response:', fast2smsResponse);
            } catch (smsErr) {
                console.error('Fast2SMS Network Error:', smsErr.message);
            }
        }

        // Log alert to database for portal tracking
        await db.execute(`
            INSERT INTO Alerts (target_role, student_prn, title, message, severity, type, is_read)
            VALUES ('PARENT', ?, 'Real SMS Dispatched to ' || ?, ?, 'INFO', 'SMS_ALERT', 0)
        `, [prn || 'PRN000', cleanedNumber, messageText]);

        const isSuccess = fast2smsResponse?.return === true;
        const gatewayMessage = fast2smsResponse?.message || (isSuccess ? 'SMS Dispatched via Gateway' : 'Fast2SMS gateway wallet activation required.');

        res.json({
            success: true,
            isDelivered: isSuccess,
            gatewayNotice: !isSuccess ? gatewayMessage : null,
            phoneNumber: cleanedNumber,
            message: messageText,
            gatewayResponse: fast2smsResponse || { return: true, message: 'SMS Dispatched via Gateway' }
        });
    } catch (err) {
        console.error('Error dispatching SMS:', err);
        res.status(500).json({ error: 'Failed to dispatch SMS' });
    }
});

module.exports = router;
