const db = require('./config/db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

async function seed() {
    try {
        console.log("Starting HyperCampus AI SQLite DB initialization...");
        const conn = await db.getConnection();

        // 1. Execute schema.sql
        const schemaPath = path.join(__dirname, 'models', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log("Executing Schema...");
        const statements = schemaSql.split(';').filter(stmt => stmt.trim());
        for (let stmt of statements) {
             await conn.execute(stmt);
        }

        console.log("Checking if data already exists...");
        const [users] = await conn.execute("SELECT count(*) as count FROM Users");
        if (users[0].count > 0) {
            console.log("Data already seeded! Skipping base seed.");
            process.exit(0);
        }

        console.log("Seeding HyperCampus AI Database...");
        
        // 1. Campuses
        await conn.execute("INSERT INTO Campuses (name, code, location) VALUES (?, ?, ?)", 
            ['Main Tech Campus - Pune', 'CAMPUS-PUN-01', 'Pune, Maharashtra']);
        await conn.execute("INSERT INTO Campuses (name, code, location) VALUES (?, ?, ?)", 
            ['Bangalore Innovation Center', 'CAMPUS-BLR-02', 'Electronic City, Bangalore']);

        // 2. Departments
        const depts = [
            'Computer Science & AI',
            'Information Technology',
            'Mechanical & Robotics'
        ];
        
        for (let d of depts) {
            await conn.execute("INSERT INTO Departments (campus_id, name) VALUES (?, ?)", [1, d]);
        }

        // Passwords
        const adminHash = await bcrypt.hash('admin123', 10);
        const facultyHash = await bcrypt.hash('faculty123', 10);
        const studentHash = await bcrypt.hash('student123', 10);
        const parentHash = await bcrypt.hash('parent123', 10);

        // 1 Admin
        await conn.execute("INSERT INTO Users (campus_id, email, password_hash, role) VALUES (?, ?, ?, ?)", 
            [1, 'admin@erp.com', adminHash, 'ADMIN']);

        // 5 Teachers
        const teachers = [
            { first: 'Ramesh', last: 'Sharma', email: 'prof.sharma@erp.com', dept: 1 },
            { first: 'Anita', last: 'Mehta', email: 'prof.mehta@erp.com', dept: 2 },
            { first: 'John', last: 'Doe', email: 'johndoe@erp.com', dept: 1 },
            { first: 'Jane', last: 'Smith', email: 'janesmith@erp.com', dept: 3 },
            { first: 'Vikram', last: 'Singh', email: 'vikram@erp.com', dept: 2 }
        ];

        let facultyIdMap = {};
        for (let [i, t] of teachers.entries()) {
            const [uRes] = await conn.execute("INSERT INTO Users (campus_id, email, password_hash, role) VALUES (?, ?, ?, ?)", 
                [1, t.email, facultyHash, 'FACULTY']);
            const userId = uRes.insertId;
            const [fRes] = await conn.execute("INSERT INTO Faculty (user_id, campus_id, first_name, last_name, dept_id) VALUES (?, ?, ?, ?, ?)", 
                [userId, 1, t.first, t.last, t.dept]);
            facultyIdMap[i+1] = fRes.insertId;
        }

        // Subjects (6 subjects)
        const subjects = [
            { name: 'Data Structures & Algorithms', dept: 1, sem: 4 },
            { name: 'Operating Systems & AI Architecture', dept: 1, sem: 5 },
            { name: 'Full-Stack Web Development', dept: 2, sem: 4 },
            { name: 'Cloud Computing & Microservices', dept: 2, sem: 6 },
            { name: 'Thermodynamics & Energy Systems', dept: 3, sem: 3 },
            { name: 'Robotics & Control Systems', dept: 3, sem: 4 },
        ];
        
        let subjectIdMap = {};
        for (let [i, s] of subjects.entries()) {
            const [sRes] = await conn.execute("INSERT INTO Subjects (name, dept_id, semester, credits) VALUES (?, ?, ?, 4)", 
                [s.name, s.dept, s.sem]);
            subjectIdMap[i+1] = sRes.insertId;
        }

        // Teacher_Subject mappings
        await conn.execute("INSERT INTO Teacher_Subject (faculty_id, subject_id) VALUES (?, ?)", [1, 1]);
        await conn.execute("INSERT INTO Teacher_Subject (faculty_id, subject_id) VALUES (?, ?)", [1, 2]);
        await conn.execute("INSERT INTO Teacher_Subject (faculty_id, subject_id) VALUES (?, ?)", [2, 3]);
        await conn.execute("INSERT INTO Teacher_Subject (faculty_id, subject_id) VALUES (?, ?)", [3, 1]);
        await conn.execute("INSERT INTO Teacher_Subject (faculty_id, subject_id) VALUES (?, ?)", [4, 5]);
        await conn.execute("INSERT INTO Teacher_Subject (faculty_id, subject_id) VALUES (?, ?)", [4, 6]);
        await conn.execute("INSERT INTO Teacher_Subject (faculty_id, subject_id) VALUES (?, ?)", [5, 4]);

        // Student PRN000 (Ritu Patel)
        const [uRes0] = await conn.execute("INSERT INTO Users (campus_id, email, password_hash, role) VALUES (?, ?, ?, ?)", 
            [1, 'ritu.patel@erp.com', studentHash, 'STUDENT']);
        await conn.execute("INSERT INTO Students (prn, user_id, campus_id, first_name, last_name, dept_id, semester) VALUES (?, ?, ?, ?, ?, ?, ?)", 
            ['PRN000', uRes0.insertId, 1, 'Ritu', 'Patel', 1, 4]);

        // Parent user for Ritu Patel
        const [pRes0] = await conn.execute("INSERT INTO Users (campus_id, email, password_hash, role) VALUES (?, ?, ?, ?)", 
            [1, 'parent@erp.com', parentHash, 'PARENT']);
        await conn.execute("INSERT INTO Parent_Student (parent_user_id, student_prn, relation) VALUES (?, ?, ?)", 
            [pRes0.insertId, 'PRN000', 'Father (Rajesh Patel)']);

        // 19 Additional Students
        const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Ananya', 'Diya', 'Avni', 'Kavya', 'Sanya', 'Riya', 'Aarohi', 'Neha', 'Pooja', 'Sneha'];
        const lastNames = ['Patel', 'Sharma', 'Singh', 'Kumar', 'Das', 'Sen', 'Gupta', 'Verma', 'Reddy', 'Rao', 'Nair', 'Pillai', 'Menon', 'Bose', 'Basu', 'Datta', 'Ghosh', 'Saha', 'Mukherjee', 'Banerjee'];
        
        for (let i = 1; i <= 19; i++) {
            const fname = firstNames[i];
            const lname = lastNames[i];
            const dept = (i % 3) + 1;
            const sem = (i % 8) + 1;
            const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${i}@erp.com`;
            const prn = `PRN${i.toString().padStart(3, '0')}`;
            
            const [uRes] = await conn.execute("INSERT INTO Users (campus_id, email, password_hash, role) VALUES (?, ?, ?, ?)", 
                [1, email, studentHash, 'STUDENT']);
            await conn.execute("INSERT INTO Students (prn, user_id, campus_id, first_name, last_name, dept_id, semester) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                [prn, uRes.insertId, 1, fname, lname, dept, sem]);

            // Add fees
            await conn.execute("INSERT INTO Fees (prn, amount, due_date, status) VALUES (?, ?, ?, ?)", 
                [prn, 50000, '2026-06-30', i % 2 === 0 ? 'PAID' : 'PENDING']);
            
            // Attendance & Marks
            if (dept === 1) {
                await conn.execute("INSERT INTO Attendance (prn, subject_id, faculty_id, date, status) VALUES (?, ?, ?, ?, ?)", 
                    [prn, 1, 1, '2026-04-10', 'PRESENT']);
                await conn.execute("INSERT INTO Attendance (prn, subject_id, faculty_id, date, status) VALUES (?, ?, ?, ?, ?)", 
                    [prn, 2, 1, '2026-04-11', i % 4 === 0 ? 'ABSENT' : 'PRESENT']);
                await conn.execute("INSERT INTO Marks (prn, subject_id, exam_type, score, total) VALUES (?, ?, ?, ?, ?)", 
                    [prn, 1, 'CIA', 14 + (i % 6), 20]);
                await conn.execute("INSERT INTO Marks (prn, subject_id, exam_type, score, total) VALUES (?, ?, ?, ?, ?)", 
                    [prn, 2, 'CIA', 12 + (i % 8), 20]);
            }
        }
        
        // Specific records for PRN000 (Ritu)
        await conn.execute("INSERT INTO Fees (prn, amount, due_date, status) VALUES (?, ?, ?, ?)", ['PRN000', 50000, '2026-06-30', 'PAID']);
        await conn.execute("INSERT INTO Attendance (prn, subject_id, faculty_id, date, status) VALUES (?, ?, ?, ?, ?)", ['PRN000', 1, 1, '2026-04-10', 'PRESENT']);
        await conn.execute("INSERT INTO Attendance (prn, subject_id, faculty_id, date, status) VALUES (?, ?, ?, ?, ?)", ['PRN000', 1, 1, '2026-04-11', 'PRESENT']);
        await conn.execute("INSERT INTO Attendance (prn, subject_id, faculty_id, date, status) VALUES (?, ?, ?, ?, ?)", ['PRN000', 2, 1, '2026-04-12', 'PRESENT']);
        await conn.execute("INSERT INTO Marks (prn, subject_id, exam_type, score, total) VALUES (?, ?, ?, ?, ?)", ['PRN000', 1, 'CIA', 18, 20]);
        await conn.execute("INSERT INTO Marks (prn, subject_id, exam_type, score, total) VALUES (?, ?, ?, ?, ?)", ['PRN000', 1, 'SEMESTER', 88, 100]);
        await conn.execute("INSERT INTO Marks (prn, subject_id, exam_type, score, total) VALUES (?, ?, ?, ?, ?)", ['PRN000', 2, 'CIA', 19, 20]);

        // 3. Seed Gamification
        const defaultBadges = JSON.stringify([
            { id: 'badge_att_90', name: 'Attendance Star', icon: '🌟', desc: 'Maintained >90% attendance' },
            { id: 'badge_quiz_master', name: 'Quiz Master', icon: '🏆', desc: 'Scored 90%+ in 3 assessments' },
            { id: 'badge_streak_7', name: '7-Day Focus Streak', icon: '🔥', desc: 'Completed daily study plan 7 days in a row' }
        ]);
        await conn.execute("INSERT INTO Gamification (prn, xp_points, streak_days, level, badges_json, completed_tasks_json) VALUES (?, ?, ?, ?, ?, ?)",
            ['PRN000', 480, 5, 2, defaultBadges, JSON.stringify([1, 2])]);

        for (let i = 1; i <= 5; i++) {
            const prn = `PRN${i.toString().padStart(3, '0')}`;
            await conn.execute("INSERT INTO Gamification (prn, xp_points, streak_days, level, badges_json, completed_tasks_json) VALUES (?, ?, ?, ?, ?, ?)",
                [prn, 200 + i * 50, 2 + i, 1 + Math.floor(i / 3), defaultBadges, '[]']);
        }

        // 4. Seed Career Profiles
        const dsaRoadmap = JSON.stringify([
            { step: 1, title: 'Advanced Graph Algorithms', status: 'COMPLETED' },
            { step: 2, title: 'Deep Learning & Neural Networks', status: 'IN_PROGRESS' },
            { step: 3, title: 'Deploying LLMs with FastAPI', status: 'PENDING' },
            { step: 4, title: 'Open Source Contribution to HuggingFace', status: 'PENDING' }
        ]);
        await conn.execute("INSERT INTO Career_Profiles (prn, target_role, skills_acquired, skills_missing, match_percentage, roadmap_json) VALUES (?, ?, ?, ?, ?, ?)",
            ['PRN000', 'AI & Machine Learning Engineer', 'Python, SQL, PyTorch, Linear Algebra', 'Kubernetes, ONNX Runtime, TensorRT', 78, dsaRoadmap]);

        // 5. Seed AI Study Plans
        await conn.execute("INSERT INTO Study_Plans (prn, subject_name, topic, target_date, status, priority, estimated_hours, xp_reward) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ['PRN000', 'Data Structures & Algorithms', 'Dynamic Programming on Trees', '2026-08-28', 'IN_PROGRESS', 'HIGH', 2, 75]);
        await conn.execute("INSERT INTO Study_Plans (prn, subject_name, topic, target_date, status, priority, estimated_hours, xp_reward) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ['PRN000', 'Operating Systems', 'Memory Virtualization & Paging', '2026-08-29', 'PENDING', 'URGENT', 3, 100]);
        await conn.execute("INSERT INTO Study_Plans (prn, subject_name, topic, target_date, status, priority, estimated_hours, xp_reward) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ['PRN000', 'Full-Stack Web Dev', 'WebSocket Real-time Communication', '2026-08-30', 'COMPLETED', 'MEDIUM', 1, 50]);

        // 6. Seed Wearable Telemetry (Biometrics Demo)
        const times = [
            { hr: 72, hrv: 65, stress: 24, sleep: 7.8, steps: 8420, label: 'Optimal Recovery' },
            { hr: 78, hrv: 58, stress: 38, sleep: 7.2, steps: 6900, label: 'Normal Focus' },
            { hr: 84, hrv: 45, stress: 62, sleep: 6.1, steps: 9100, label: 'Mild Fatigue' },
            { hr: 70, hrv: 70, stress: 18, sleep: 8.0, steps: 10400, label: 'Peak Performance' }
        ];
        for (let t of times) {
            await conn.execute("INSERT INTO Wearable_Telemetry (prn, heart_rate, hrv, stress_index, sleep_hours, steps, status_label) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ['PRN000', t.hr, t.hrv, t.stress, t.sleep, t.steps, t.label]);
        }

        // 7. Seed Smart CCTV Analytics
        const zones = [
            { cam: 'CAM-A101', loc: 'Classroom A-101 (CS Labs)', occ: 38, cap: 45, status: 'Normal', anom: 0, desc: null },
            { cam: 'CAM-L204', loc: 'Central Library Floor 2', occ: 74, cap: 80, status: 'High Occupancy', anom: 0, desc: null },
            { cam: 'CAM-G012', loc: 'Main Cafeteria & Lounge', occ: 120, cap: 150, status: 'Normal', anom: 0, desc: null },
            { cam: 'CAM-E305', loc: 'Server Room Corridor', occ: 2, cap: 5, status: 'Restricted Access', anom: 1, desc: 'Unscheduled movement detected outside lab hours' }
        ];
        for (let z of zones) {
            await conn.execute("INSERT INTO CCTV_Analytics (campus_id, camera_name, zone_location, occupancy_count, capacity, status, anomaly_detected, anomaly_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [1, z.cam, z.loc, z.occ, z.cap, z.status, z.anom, z.desc]);
        }

        // 8. Seed Exam Violations
        await conn.execute("INSERT INTO Exam_Violations (student_prn, subject, score, violation_type, details, severity) VALUES (?, ?, ?, ?, ?, ?)",
            ['PRN003', 'Operating Systems & AI Architecture', 65, 'Tab Switched / Window Focus Lost', 'Switched application window for 14 seconds during Section B', 'HIGH']);
        await conn.execute("INSERT INTO Exam_Violations (student_prn, subject, score, violation_type, details, severity) VALUES (?, ?, ?, ?, ?, ?)",
            ['PRN007', 'Data Structures & Algorithms', 48, 'Looking Away / Multiple Faces', 'Face angle exceeded 45 degrees deviation from screen for >10 seconds', 'CRITICAL']);

        // 9. Seed Unified Smart Alerts
        const sampleAlerts = [
            { role: 'STUDENT', prn: 'PRN000', title: 'Upcoming CIA Assessment', msg: 'Your Operating Systems CIA Assessment is scheduled in 3 days. Complete your priority study plan.', sev: 'INFO', type: 'ACADEMIC' },
            { role: 'PARENT', prn: 'PRN000', title: 'Child Academic Progress Update', msg: 'Ritu Patel has maintained 96% attendance and completed 3 milestone study modules.', sev: 'INFO', type: 'PARENT_UPDATE' },
            { role: 'FACULTY', prn: null, title: 'At-Risk Student Flagged', msg: '3 students in Computer Science Dept are exhibiting <75% attendance trends.', sev: 'WARNING', type: 'ATTENDANCE_RISK' },
            { role: 'ADMIN', prn: null, title: 'CCTV Security Flag in Zone E-305', msg: 'Unscheduled entry recorded in Server Room corridor.', sev: 'HIGH', type: 'SECURITY' }
        ];

        for (let a of sampleAlerts) {
            await conn.execute("INSERT INTO Alerts (target_role, student_prn, title, message, severity, type, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)",
                [a.role, a.prn, a.title, a.msg, a.sev, a.type]);
        }

        console.log("HyperCampus AI Seeding complete! 🎉");
        process.exit(0);

    } catch(err) {
        console.error("Setup Error:", err);
        process.exit(1);
    }
}

seed();
