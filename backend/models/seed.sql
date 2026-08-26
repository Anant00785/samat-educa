-- ============================================================
-- College ERP — Seed Data (Run AFTER schema.sql)
-- ============================================================

-- Departments
INSERT INTO Departments (name) VALUES
    ('Computer Science'),
    ('Electronics'),
    ('Mechanical'),
    ('Civil');

-- Users (passwords: admin123, faculty123, student123)
INSERT INTO Users (email, password_hash, role) VALUES
    ('admin@g.com',   '$2b$10$X4kv7j5ZcG4Z8n1QwYvBqOv5V1aY3dG8LQzJv0H3E5n8r7T2sB4uO', 'ADMIN'),
    ('prof.sharma@erp.com', '$2b$10$X4kv7j5ZcG4Z8n1QwYvBqOv5V1aY3dG8LQzJv0H3E5n8r7T2sB4uO', 'FACULTY'),
    ('prof.mehta@erp.com',  '$2b$10$X4kv7j5ZcG4Z8n1QwYvBqOv5V1aY3dG8LQzJv0H3E5n8r7T2sB4uO', 'FACULTY'),
    ('ritu.patel@erp.com',  '$2b$10$X4kv7j5ZcG4Z8n1QwYvBqOv5V1aY3dG8LQzJv0H3E5n8r7T2sB4uO', 'STUDENT'),
    ('arjun.singh@erp.com', '$2b$10$X4kv7j5ZcG4Z8n1QwYvBqOv5V1aY3dG8LQzJv0H3E5n8r7T2sB4uO', 'STUDENT');

-- Faculty
INSERT INTO Faculty (user_id, first_name, last_name, dept_id) VALUES
    (2, 'Dr. Ramesh', 'Sharma', 1),
    (3, 'Prof. Anita', 'Mehta', 2);

-- Students
INSERT INTO Students (prn, user_id, first_name, last_name, dept_id, semester) VALUES
    ('PRN001', 4, 'Ritu', 'Patel', 1, 4),
    ('PRN002', 5, 'Arjun', 'Singh', 1, 4),
    ('PRN003', 4, 'Suraj', 'Rajput', 1, 4),
    ('PRN004', 4, 'Prathamesh', 'Desai', 1, 4),
    ('PRN005', 4, 'Sayma', 'Pathan', 1, 4),
    ('PRN006', 4, 'Prajkta', 'Nandurkar', 1, 4);

-- Subjects
INSERT INTO Subjects (name, dept_id, semester, credits) VALUES
    ('Data Structures', 1, 4, 4),
    ('Operating Systems', 1, 4, 4),
    ('Database Management', 1, 4, 3),
    ('Computer Networks', 1, 4, 3);

-- Attendance (sample records)
INSERT INTO Attendance (prn, subject_id, faculty_id, date, status) VALUES
    ('PRN001', 1, 1, '2026-03-01', 'PRESENT'),
    ('PRN001', 1, 1, '2026-03-03', 'PRESENT'),
    ('PRN001', 1, 1, '2026-03-05', 'ABSENT'),
    ('PRN001', 2, 1, '2026-03-02', 'PRESENT'),
    ('PRN001', 2, 1, '2026-03-04', 'PRESENT'),
    ('PRN001', 3, 2, '2026-03-01', 'ABSENT'),
    ('PRN001', 3, 2, '2026-03-03', 'PRESENT'),
    ('PRN002', 1, 1, '2026-03-01', 'PRESENT'),
    ('PRN002', 1, 1, '2026-03-03', 'ABSENT'),
    ('PRN002', 2, 1, '2026-03-02', 'PRESENT');

-- Marks (sample)
INSERT INTO Marks (prn, subject_id, exam_type, score, total) VALUES
    ('PRN001', 1, 'CIA',      18, 20),
    ('PRN001', 1, 'SEMESTER', 72, 100),
    ('PRN001', 2, 'CIA',      15, 20),
    ('PRN001', 2, 'SEMESTER', 58, 100),
    ('PRN001', 3, 'CIA',      19, 20),
    ('PRN001', 3, 'SEMESTER', 81, 100),
    ('PRN002', 1, 'CIA',      12, 20),
    ('PRN002', 1, 'SEMESTER', 55, 100);

-- Fees (sample)
INSERT INTO Fees (prn, amount, due_date, status) VALUES
    ('PRN001', 45000.00, '2026-06-30', 'PAID'),
    ('PRN001', 5000.00,  '2026-03-15', 'PENDING'),
    ('PRN002', 45000.00, '2026-06-30', 'PENDING');
