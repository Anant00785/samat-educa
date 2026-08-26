-- =======================================================
-- HyperCampus AI - Core Schema
-- Supports Multi-Campus Tenancy & Intelligent Campus OS
-- =======================================================

-- 1. Campuses (Multi-Campus Cloud Architecture)
CREATE TABLE IF NOT EXISTS Campuses (
    campus_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    location VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Core Users Table (Handling RBAC including PARENT)
CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    campus_id INTEGER DEFAULT 1,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK(role IN ('ADMIN', 'FACULTY', 'STUDENT', 'PARENT')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campus_id) REFERENCES Campuses(campus_id) ON DELETE SET NULL
);

-- 3. Departments
CREATE TABLE IF NOT EXISTS Departments (
    dept_id INTEGER PRIMARY KEY AUTOINCREMENT,
    campus_id INTEGER DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (campus_id) REFERENCES Campuses(campus_id) ON DELETE CASCADE
);

-- 4. Students Table
CREATE TABLE IF NOT EXISTS Students (
    prn VARCHAR(20) PRIMARY KEY,
    user_id INTEGER,
    campus_id INTEGER DEFAULT 1,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    dept_id INTEGER,
    semester INTEGER,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dept_id) REFERENCES Departments(dept_id) ON DELETE SET NULL,
    FOREIGN KEY (campus_id) REFERENCES Campuses(campus_id) ON DELETE CASCADE
);

-- 5. Faculty Table
CREATE TABLE IF NOT EXISTS Faculty (
    faculty_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    campus_id INTEGER DEFAULT 1,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    dept_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dept_id) REFERENCES Departments(dept_id) ON DELETE SET NULL,
    FOREIGN KEY (campus_id) REFERENCES Campuses(campus_id) ON DELETE CASCADE
);

-- 6. Subjects Table
CREATE TABLE IF NOT EXISTS Subjects (
    subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    dept_id INTEGER,
    semester INTEGER,
    credits INTEGER,
    FOREIGN KEY (dept_id) REFERENCES Departments(dept_id) ON DELETE CASCADE
);

-- 7. Teacher_Subject Mapping Table
CREATE TABLE IF NOT EXISTS Teacher_Subject (
    faculty_id INTEGER,
    subject_id INTEGER,
    PRIMARY KEY (faculty_id, subject_id),
    FOREIGN KEY (faculty_id) REFERENCES Faculty(faculty_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE CASCADE
);

-- 8. Attendance Table
CREATE TABLE IF NOT EXISTS Attendance (
    attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prn VARCHAR(20),
    subject_id INTEGER,
    faculty_id INTEGER,
    date DATE,
    status VARCHAR(10) CHECK(status IN ('PRESENT', 'ABSENT')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prn) REFERENCES Students(prn) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES Faculty(faculty_id) ON DELETE CASCADE
);

-- 9. Marks Table
CREATE TABLE IF NOT EXISTS Marks (
    mark_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prn VARCHAR(20),
    subject_id INTEGER,
    exam_type VARCHAR(20) CHECK(exam_type IN ('CIA', 'SEMESTER', 'PRACTICAL')),
    score DECIMAL(5,2),
    total DECIMAL(5,2),
    FOREIGN KEY (prn) REFERENCES Students(prn) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE CASCADE
);

-- 10. Fees Table
CREATE TABLE IF NOT EXISTS Fees (
    fee_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prn VARCHAR(20),
    amount DECIMAL(10,2),
    due_date DATE,
    status VARCHAR(10) CHECK(status IN ('PAID', 'PENDING')),
    FOREIGN KEY (prn) REFERENCES Students(prn) ON DELETE CASCADE
);

-- 11. Faculty Alerts Table (Mood Fusion)
CREATE TABLE IF NOT EXISTS Faculty_Alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prn VARCHAR(20),
    mood VARCHAR(20),
    suggestions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prn) REFERENCES Students(prn) ON DELETE CASCADE
);

-- 12. Parent_Student Mapping (Parent Portal)
CREATE TABLE IF NOT EXISTS Parent_Student (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_user_id INTEGER NOT NULL,
    student_prn VARCHAR(20) NOT NULL,
    relation VARCHAR(50) DEFAULT 'Parent/Guardian',
    FOREIGN KEY (parent_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (student_prn) REFERENCES Students(prn) ON DELETE CASCADE
);

-- 13. Unified Smart Alert System
CREATE TABLE IF NOT EXISTS Alerts (
    alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    target_role VARCHAR(20),
    student_prn VARCHAR(20),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) CHECK(severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')) DEFAULT 'INFO',
    type VARCHAR(50) DEFAULT 'GENERAL',
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (student_prn) REFERENCES Students(prn) ON DELETE CASCADE
);

-- 14. Exam Proctoring Violations Log
CREATE TABLE IF NOT EXISTS Exam_Violations (
    violation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_prn VARCHAR(20) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    score INTEGER,
    violation_type VARCHAR(100) NOT NULL,
    details TEXT,
    severity VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_prn) REFERENCES Students(prn) ON DELETE CASCADE
);

-- 15. AI Study Planner
CREATE TABLE IF NOT EXISTS Study_Plans (
    plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prn VARCHAR(20) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    topic VARCHAR(150) NOT NULL,
    target_date DATE NOT NULL,
    status VARCHAR(20) CHECK(status IN ('PENDING', 'COMPLETED', 'IN_PROGRESS')) DEFAULT 'PENDING',
    priority VARCHAR(20) CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) DEFAULT 'MEDIUM',
    estimated_hours INTEGER DEFAULT 2,
    xp_reward INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prn) REFERENCES Students(prn) ON DELETE CASCADE
);

-- 16. AI Career Guidance
CREATE TABLE IF NOT EXISTS Career_Profiles (
    profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prn VARCHAR(20) UNIQUE NOT NULL,
    target_role VARCHAR(100) NOT NULL,
    skills_acquired TEXT,
    skills_missing TEXT,
    match_percentage INTEGER DEFAULT 50,
    roadmap_json TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prn) REFERENCES Students(prn) ON DELETE CASCADE
);

-- 17. Gamified Learning System
CREATE TABLE IF NOT EXISTS Gamification (
    gamification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prn VARCHAR(20) UNIQUE NOT NULL,
    xp_points INTEGER DEFAULT 150,
    streak_days INTEGER DEFAULT 3,
    level INTEGER DEFAULT 1,
    badges_json TEXT,
    completed_tasks_json TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prn) REFERENCES Students(prn) ON DELETE CASCADE
);

-- 18. Wearable Stress Telemetry (Integration Ready)
CREATE TABLE IF NOT EXISTS Wearable_Telemetry (
    telemetry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prn VARCHAR(20) NOT NULL,
    heart_rate INTEGER,
    hrv INTEGER,
    stress_index INTEGER,
    sleep_hours DECIMAL(4,2),
    steps INTEGER,
    status_label VARCHAR(50),
    device_source VARCHAR(50) DEFAULT 'Simulated Wearable BioSensor v2.1',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prn) REFERENCES Students(prn) ON DELETE CASCADE
);

-- 19. Smart CCTV Analytics
CREATE TABLE IF NOT EXISTS CCTV_Analytics (
    analytics_id INTEGER PRIMARY KEY AUTOINCREMENT,
    campus_id INTEGER DEFAULT 1,
    camera_name VARCHAR(100) NOT NULL,
    zone_location VARCHAR(100) NOT NULL,
    occupancy_count INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'Normal',
    anomaly_detected INTEGER DEFAULT 0,
    anomaly_description TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campus_id) REFERENCES Campuses(campus_id) ON DELETE CASCADE
);

-- 20. HyperIntervene AI — Active Interventions & Tracking
CREATE TABLE IF NOT EXISTS Interventions (
    intervention_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_prn VARCHAR(20) NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    reason TEXT NOT NULL,
    owner_role VARCHAR(20) NOT NULL,
    owner_name VARCHAR(100),
    priority VARCHAR(20) CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) DEFAULT 'HIGH',
    status VARCHAR(20) CHECK(status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED')) DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    action_type VARCHAR(50) DEFAULT 'RECOVERY_PLAN',
    completed_at TIMESTAMP,
    outcome TEXT,
    outcome_score INTEGER,
    created_by VARCHAR(50) DEFAULT 'HyperIntervene AI',
    timeline_json TEXT,
    metadata_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_prn) REFERENCES Students(prn) ON DELETE CASCADE
);
