/**
 * seed.js — Run this once to insert demo data with real bcrypt hashes
 * Usage: node models/seed.js
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./config/db');

async function seed() {
    console.log('🌱 Seeding database...');
    try {
        const adminHash    = await bcrypt.hash('admin123', 10);
        const facultyHash  = await bcrypt.hash('faculty123', 10);
        const studentHash  = await bcrypt.hash('student123', 10);

        // Departments
        await db.execute("INSERT IGNORE INTO Departments (dept_id, name) VALUES (1,'Computer Science'),(2,'Electronics'),(3,'Mechanical'),(4,'Civil')");

        // Users
        await db.execute(`
            INSERT IGNORE INTO Users (user_id, email, password_hash, role) VALUES
            (1, 'admin@erp.com',       ?, 'ADMIN'),
            (2, 'prof.sharma@erp.com', ?, 'FACULTY'),
            (3, 'prof.mehta@erp.com',  ?, 'FACULTY'),
            (4, 'ritu.patel@erp.com',  ?, 'STUDENT'),
            (5, 'arjun.singh@erp.com', ?, 'STUDENT')
        `, [adminHash, facultyHash, facultyHash, studentHash, studentHash]);

        // Faculty
        await db.execute(`
            INSERT IGNORE INTO Faculty (faculty_id, user_id, first_name, last_name, dept_id) VALUES
            (1, 2, 'Dr. Ramesh', 'Sharma', 1),
            (2, 3, 'Prof. Anita', 'Mehta', 2)
        `);

        // Students
        await db.execute(`
            INSERT IGNORE INTO Students (prn, user_id, first_name, last_name, dept_id, semester) VALUES
            ('PRN001', 4, 'Ritu', 'Patel', 1, 4),
            ('PRN002', 5, 'Arjun', 'Singh', 1, 4)
        `);

        // Subjects
        await db.execute(`
            INSERT IGNORE INTO Subjects (subject_id, name, dept_id, semester, credits) VALUES
            (1, 'Data Structures', 1, 4, 4),
            (2, 'Operating Systems', 1, 4, 4),
            (3, 'Database Management', 1, 4, 3),
            (4, 'Computer Networks', 1, 4, 3)
        `);

        // Attendance
        const attendanceData = [
            ['PRN001', 1, 1, '2026-03-01', 'PRESENT'],
            ['PRN001', 1, 1, '2026-03-03', 'PRESENT'],
            ['PRN001', 1, 1, '2026-03-05', 'ABSENT'],
            ['PRN001', 2, 1, '2026-03-02', 'PRESENT'],
            ['PRN001', 2, 1, '2026-03-04', 'PRESENT'],
            ['PRN001', 3, 2, '2026-03-01', 'ABSENT'],
            ['PRN001', 3, 2, '2026-03-03', 'PRESENT'],
            ['PRN001', 4, 2, '2026-03-05', 'PRESENT'],
            ['PRN002', 1, 1, '2026-03-01', 'PRESENT'],
            ['PRN002', 1, 1, '2026-03-03', 'ABSENT'],
            ['PRN002', 2, 1, '2026-03-02', 'PRESENT'],
        ];
        for (const r of attendanceData) {
            await db.execute(
                'INSERT INTO Attendance (prn, subject_id, faculty_id, date, status) VALUES (?,?,?,?,?)', r
            );
        }

        // Marks
        const marksData = [
            ['PRN001', 1, 'CIA',      18, 20],
            ['PRN001', 1, 'SEMESTER', 72, 100],
            ['PRN001', 2, 'CIA',      15, 20],
            ['PRN001', 2, 'SEMESTER', 58, 100],
            ['PRN001', 3, 'CIA',      19, 20],
            ['PRN001', 3, 'SEMESTER', 81, 100],
            ['PRN001', 4, 'CIA',      16, 20],
            ['PRN002', 1, 'CIA',      12, 20],
            ['PRN002', 1, 'SEMESTER', 55, 100],
        ];
        for (const m of marksData) {
            await db.execute(
                'INSERT INTO Marks (prn, subject_id, exam_type, score, total) VALUES (?,?,?,?,?)', m
            );
        }

        // Fees
        await db.execute(`
            INSERT INTO Fees (prn, amount, due_date, status) VALUES
            ('PRN001', 45000.00, '2026-06-30', 'PAID'),
            ('PRN001', 5000.00,  '2026-03-15', 'PENDING'),
            ('PRN002', 45000.00, '2026-06-30', 'PENDING')
        `);

        console.log('✅ Database seeded successfully!');
        console.log('\n📋 Demo Credentials:');
        console.log('   Admin:   admin@erp.com    / admin123');
        console.log('   Faculty: prof.sharma@erp.com / faculty123');
        console.log('   Student: ritu.patel@erp.com  / student123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
}

seed();
