const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcrypt');

async function initDB() {
    try {
        console.log("Connecting to MySQL without database...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log("Creating database if not exists...");
        await connection.query('CREATE DATABASE IF NOT EXISTS college_erp');
        await connection.query('USE college_erp');

        console.log("Creating Users table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('ADMIN', 'FACULTY', 'STUDENT') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Hashing passwords...");
        const adminHash = await bcrypt.hash('admin123', 10);
        const facultyHash = await bcrypt.hash('faculty123', 10);
        const studentHash = await bcrypt.hash('student123', 10);

        console.log("Inserting demo users...");
        await connection.query('INSERT IGNORE INTO Users (email, password_hash, role) VALUES (?, ?, ?)', ['admin@erp.com', adminHash, 'ADMIN']);
        await connection.query('INSERT IGNORE INTO Users (email, password_hash, role) VALUES (?, ?, ?)', ['prof.sharma@erp.com', facultyHash, 'FACULTY']);
        await connection.query('INSERT IGNORE INTO Users (email, password_hash, role) VALUES (?, ?, ?)', ['ritu.patel@erp.com', studentHash, 'STUDENT']);

        console.log("Database initialized successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error setting up database:", err);
        process.exit(1);
    }
}

initDB();
